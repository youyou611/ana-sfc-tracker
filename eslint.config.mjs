import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/** ESLint 9 flat config for Next.js 16 and TypeScript. */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    files: ["app/calc/page.tsx"],
    // This page deliberately hydrates persisted form state and synchronizes editable distance/fare inputs.
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  {
    files: ["app/components/FlightCardImage.tsx", "app/components/FlightDetailModal.tsx"],
    // Aircraft assets and user photos are local files or IndexedDB data URLs rendered dynamically.
    rules: { "@next/next/no-img-element": "off" },
  },
];

export default eslintConfig;
