"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsTabs({
  photos,
  testimonials,
}: {
  photos: ReactNode;
  testimonials: ReactNode;
}) {
  return (
    <Tabs defaultValue="photos" className="w-full">
      <TabsList>
        <TabsTrigger value="photos">Hero photos</TabsTrigger>
        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
      </TabsList>
      <TabsContent value="photos">
        <Card>
          <CardHeader>
            <CardTitle>Hero photos</CardTitle>
            <CardDescription>
              The carousel at the top of the public homepage. You can keep up to 3 slides, change
              each picture, and move them into the order visitors will see. With two or more
              slides, the photos rotate automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>{photos}</CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="testimonials">
        <Card>
          <CardHeader>
            <CardTitle>Testimonials</CardTitle>
            <CardDescription>
              Up to 12 quotes on the public homepage. For each one you can change the name, the
              line under the name, the testimonial text, and an optional photo.
            </CardDescription>
          </CardHeader>
          <CardContent>{testimonials}</CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
