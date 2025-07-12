"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { TextPressure } from "@/components/ui/interactive-text-pressure"
import { GradientText } from "@/components/ui/gradient-text";

function getTextColor(theme: string | undefined) {
  return theme === "dark" ? "#ffffff" : "#111111"
}

function getStrokeColor(theme: string | undefined) {
  return theme === "dark" ? "#ff0000" : "#0066ff"
}

export function Default() {
  const { theme } = useTheme()
  return (
    <TextPressure
      text="Hello!"
      flex={false}
      alpha={false}
      stroke={false}
      width={true}
      weight={true}
      italic={true}
      textColor={getTextColor(theme)}
      strokeColor={getStrokeColor(theme)}
      minFontSize={36}
      className="cursor-default"
    />
  )
}

export function Flex() {
  const { theme } = useTheme()
  return (
    <TextPressure
      text="Hello!"
      flex={true}
      alpha={false}
      stroke={false}
      width={true}
      weight={true}
      italic={true}
      textColor={getTextColor(theme)}
      strokeColor={getStrokeColor(theme)}
      minFontSize={36}
      className="cursor-default"
    />
  )
}

export function Alpha() {
  const { theme } = useTheme()
  return (
    <TextPressure
      text="Hello!"
      flex={true}
      alpha={true}
      stroke={false}
      width={true}
      weight={true}
      italic={true}
      textColor={getTextColor(theme)}
      strokeColor={getStrokeColor(theme)}
      minFontSize={36}
      className="cursor-default"
    />
  )
}

export function Stroke() {
  const { theme } = useTheme()
  return (
    <TextPressure
      text="Hello!"
      flex={true}
      alpha={false}
      stroke={true}
      width={true}
      weight={true}
      italic={true}
      textColor={getTextColor(theme)}
      strokeColor={getStrokeColor(theme)}
      minFontSize={36}
      className="cursor-default"
    />
  )
}

export function GradientTextDemo() {
  return (
    <h1 className="text-center text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl">
      Design <GradientText>without</GradientText> Limits
    </h1>
  );
} 