import React from "react";
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

export default function Dashboard() {
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
                      <div className="text-2xl font-semibold">24.5°C</div>
                      <div className="text-xs text-slate-500">Inside probe</div>
                    </div>
                    <Badge variant="secondary">Stable</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Humidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">45%</div>
                  <div className="text-xs text-slate-500">Room</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Light</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">400</div>
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
                      <div className="text-xs text-slate-500">2m ago</div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>DHT read success</div>
                      <div className="text-xs text-slate-500">5m ago</div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>MPU6050 calibrated</div>
                      <div className="text-xs text-slate-500">12m ago</div>
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
                    MQTT: <span className="font-medium">Connected</span>
                  </div>
                  <div className="text-sm">
                    Sensors: <span className="font-medium">OK</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>

        <Separator className="my-6" />

        <footer className="text-xs text-slate-500 text-center">
          Simple, responsive dashboard built with shadcn components.
        </footer>
      </div>
    </div>
  );
}
