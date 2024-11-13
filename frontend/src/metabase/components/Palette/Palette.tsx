// eslint-disable-next-line no-restricted-imports
import { Input } from "@mantine/core";
import { type ChangeEvent, useState } from "react";

import { colors } from "metabase/lib/colors";

const Palette = () => {
  const [palette, setPalette] = useState(colors);

  const handleChangeColor =
    (colorKey: string) => (e: ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem(
        "colorPalette",
        JSON.stringify({
          ...palette,
          [colorKey]: e.target.value,
        }),
      );
      setPalette(
        JSON.parse(localStorage.getItem("colorPalette") ?? "null") ?? colors,
      );
    };

  return (
    <div>
      <h1>Palette</h1>
      <div
        style={{
          padding: "24px",
        }}
      >
        {Object.entries(palette).map(([colorName, value]) => (
          <div
            key={colorName}
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid gray",
              justifyContent: "space-between",
              padding: "8px 0",
            }}
          >
            <span style={{ fontSize: "20px" }}>{colorName}</span>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "20px" }}>{value}</span>
              <Input
                style={{ width: "500px" }}
                type="color"
                value={value}
                onChange={handleChangeColor(colorName)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { Palette };
