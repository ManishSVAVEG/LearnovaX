const COLORS = {
  bg: "#0A0E1A",
  bgSecondary: "#121828",
  surface: "#1C2240",
  surfaceHigh: "#242C4E",
  border: "#2A3560",
  borderLight: "#3A4570",

  primary: "#4F8EF7",
  primaryDark: "#3A7AE4",
  primaryGlow: "rgba(79, 142, 247, 0.2)",

  accent: "#00D4AA",
  accentDark: "#00B891",
  accentGlow: "rgba(0, 212, 170, 0.2)",

  gold: "#F5C842",
  goldGlow: "rgba(245, 200, 66, 0.2)",

  danger: "#FF4D6A",
  dangerGlow: "rgba(255, 77, 106, 0.15)",

  success: "#22D46E",
  successGlow: "rgba(34, 212, 110, 0.15)",

  warning: "#FFB340",

  text: "#FFFFFF",
  textSecondary: "#8A9BC0",
  textMuted: "#4A5680",

  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  gradientPrimary: ["#4F8EF7", "#7B5EF8"] as const,
  gradientAccent: ["#00D4AA", "#4F8EF7"] as const,
  gradientDark: ["#0A0E1A", "#121828"] as const,
  gradientSurface: ["#1C2240", "#242C4E"] as const,
  gradientGold: ["#F5C842", "#FF9F43"] as const,
};

export default COLORS;
