"use client";

import React, { useEffect, useState } from "react";
import mqtt, { Client } from "mqtt";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Calendar } from "lucide-react";

/*
  Notes:
  - The ESP32 publishes JSON with keys: id, temp, humid, ldr, vib, relay, ts
  - MQTT topic used by device: "industrial/monitor"
  - Browser must use a WebSocket-capable broker URL. Adjust MQTT_URL if you run your own broker with websockets.
*/

const MQTT_URL = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC = "industrial/monitor";

type SensorState = {
  temperature: number | null;
  humidity: number | null;
  light: number | null;
  vib: number | null;
  relay: number | null;
};

function formatTs(ts: number | null) {
  if (!ts) return "--";
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "--";
  }
}

function formatUptime(ms: number | null) {
  if (ms === null || ms === undefined) return "";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  return `${m}m ${remS}s`;
}

export default function Dashboard() {
  const [mqttConnected, setMqttConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorState>({
    temperature: null,
    humidity: null,
    light: null,
    vib: null,
    relay: null,
  });
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | null>(null);

  // New: store device-reported uptime (ms) when device sends a small ts value
  const [deviceUptimeMs, setDeviceUptimeMs] = useState<number | null>(null);

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL, {
      clientId: `dashboard-${Math.random().toString(16).slice(2)}`,
      connectTimeout: 30_000,
      keepalive: 30,
      reconnectPeriod: 2000,
    });

    client.on("connect", () => {
      setMqttConnected(true);
      client.subscribe(MQTT_TOPIC, (err) => {
        if (err) console.error("Subscribe error:", err);
      });
    });

    client.on("reconnect", () => setMqttConnected(false));
    client.on("close", () => setMqttConnected(false));
    client.on("offline", () => setMqttConnected(false));
    client.on("error", (err) => {
      console.error("MQTT error:", err);
      setMqttConnected(false);
    });

    client.on("message", (_topic, message) => {
      try {
        const payload = JSON.parse(message.toString());

        const next: SensorState = {
          temperature:
            typeof payload.temp === "number"
              ? payload.temp
              : payload.temp !== undefined
              ? Number(payload.temp)
              : null,
          humidity:
            typeof payload.humid === "number"
              ? payload.humid
              : payload.humid !== undefined
              ? Number(payload.humid)
              : null,
          light:
            typeof payload.ldr === "number"
              ? payload.ldr
              : payload.ldr !== undefined
              ? Number(payload.ldr)
              : null,
          vib:
            typeof payload.vib === "number"
              ? payload.vib
              : payload.vib !== undefined
              ? Number(payload.vib)
              : null,
          relay:
            typeof payload.relay === "number"
              ? payload.relay
              : payload.relay !== undefined
              ? Number(payload.relay)
              : null,
        };

        setSensorData((s) => ({ ...s, ...next }));

        // Normalize/interpret payload.ts robustly
        // Cases:
        //  - epoch ms (e.g. 1690000000000)  -> use as-is
        //  - epoch seconds (e.g. 1690000000) -> *1000
        //  - small number (e.g. 40000) -> device uptime in ms; approximate event time = arrival
        let tsMs: number | null = null;
        let deviceUptime: number | null = null;
        if (payload.ts !== undefined && payload.ts !== null) {
          const raw = Number(payload.ts);
          if (!isNaN(raw)) {
            if (raw > 1e12) {
              // already milliseconds epoch
              tsMs = raw;
            } else if (raw > 1e9) {
              // seconds epoch -> convert to ms
              tsMs = raw * 1000;
            } else if (raw >= 0) {
              // small number -> treat as device uptime (ms)
              deviceUptime = raw;
              // we can't reconstruct exact historic epoch reliably,
              // so use arrival time as the event time (best-effort).
              tsMs = Date.now();
            }
          }
        } else {
          tsMs = Date.now();
        }

        // set device uptime if we detected one (useful in UI)
        if (deviceUptime !== null) {
          setDeviceUptimeMs(deviceUptime);
        } else {
          // clear previous uptime value if payload provided absolute ts
          setDeviceUptimeMs(null);
        }

        // Use arrival time as fallback if tsMs couldn't be computed
        if (!tsMs) tsMs = Date.now();

        setLastUpdatedMs(tsMs);
      } catch (e) {
        console.error("Invalid MQTT payload:", e);
      }
    });

    return () => {
      try {
        client.end(true);
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="/avatar.png" alt="avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-medium">Overview</h1>
              <p className="text-sm text-slate-500">Minimal dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Input placeholder="Search" className="w-44 hidden sm:block" />
            <Button variant="outline" className="hidden sm:inline-flex">
              New
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2">
                  <Calendar className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem>Today</DropdownMenuItem>
                <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <section className="md:col-span-2 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Temperature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-semibold">
                        {mqttConnected && sensorData.temperature !== null
                          ? `${sensorData.temperature}°C`
                          : "--"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Inside probe
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {mqttConnected ? "Stable" : "Offline"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Humidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {mqttConnected && sensorData.humidity !== null
                      ? `${sensorData.humidity}%`
                      : "--"}
                  </div>
                  <div className="text-xs text-slate-500">Room</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Light</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {mqttConnected && sensorData.light !== null
                      ? sensorData.light
                      : "--"}
                  </div>
                  <div className="text-xs text-slate-500">LDR value</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea style={{ height: 160 }}>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-center justify-between">
                      <div>MQTT connected</div>
                      <div className="text-xs text-slate-500">
                        {mqttConnected ? "now" : "offline"}
                      </div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>DHT read success</div>
                      <div className="text-xs text-slate-500">device</div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>MPU6050 calibrated</div>
                      <div className="text-xs text-slate-500">device</div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>Last update (device ts)</div>
                      <div className="text-xs text-slate-500">
                        {lastUpdatedMs ? formatTs(lastUpdatedMs) : "--"}
                        {deviceUptimeMs ? ` (uptime ${formatUptime(deviceUptimeMs)})` : ""}
                      </div>
                    </li>
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <Button>Sync now</Button>
                  <Button variant="outline">Export CSV</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="text-sm">
                    MQTT:{" "}
                    <span className="font-medium">
                      {mqttConnected ? "Connected" : "--"}
                    </span>
                  </div>
                  <div className="text-sm">
                    Sensors: <span className="font-medium">OK</span>
                  </div>
                  <div className="text-sm">
                    Last update:{" "}
                    <span className="font-medium">
                      {lastUpdatedMs ? formatTs(lastUpdatedMs) : "--"}
                    </span>
                    {deviceUptimeMs ? ` • uptime ${formatUptime(deviceUptimeMs)}` : ""}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>

        <Separator className="my-6" />
      </div>
    </div>
  );
}
