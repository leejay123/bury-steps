"use client";

import { createContext } from "react";

/**
 * Who keeps seeing who's on the walk (the designer's Attended block):
 * "clocked-in" — anyone who clocked in, still after clocking out (the
 * default); "on-walk" — only while on the walk, gone once they clock out.
 * Read by the walk page's who's-on-the-walk list (WalkLivePanel).
 */
export type AttendedRule = "clocked-in" | "on-walk";
export const AttendedRuleContext = createContext<AttendedRule>("clocked-in");
