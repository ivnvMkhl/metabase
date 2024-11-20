import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { FontWidgetProps } from "./FontWidget";
import FontWidget from "./FontWidget";
import type { FontSetting, FontSettingValues } from "./types";

const FONT_FILES_KEY = "application-font-files";

describe("FontWidget", () => {
  it("should set a built-in font from a built-in font", async () => {
    const props = getProps();

    render(<FontWidget {...props} />);
    await clickSelect("Manrope");
    await userEvent.click(screen.getByText("Lora"));

    expect(props.onChange).toHaveBeenCalledWith("Lora");
    expect(props.onChangeSetting).toHaveBeenCalledWith(FONT_FILES_KEY, null);
  });

  it("should set a custom font from a built-in font", async () => {
    const props = getProps({
      setting: getSetting({
        value: "Lora",
      }),
    });

    render(<FontWidget {...props} />);
    await clickSelect("Lora");
    await userEvent.click(screen.getByText("Custom…"));

    expect(props.onChange).toHaveBeenCalledWith("Manrope");
    expect(props.onChangeSetting).toHaveBeenCalledWith(FONT_FILES_KEY, []);
  });

  it("should set a built-in font from a custom font", async () => {
    const props = getProps({
      settingValues: getSettingValues({
        "application-font-files": [],
      }),
    });

    render(<FontWidget {...props} />);
    await clickSelect("Custom…");
    await userEvent.click(screen.getByText("Lora"));

    expect(props.onChange).toHaveBeenCalledWith("Lora");
    expect(props.onChangeSetting).toHaveBeenCalledWith(FONT_FILES_KEY, null);
  });
});

const getProps = (opts?: Partial<FontWidgetProps>): FontWidgetProps => ({
  setting: getSetting(),
  settingValues: getSettingValues(),
  availableFonts: ["Manrope", "Lora"],
  onChange: jest.fn(),
  onChangeSetting: jest.fn(),
  ...opts,
});

const getSetting = (opts?: Partial<FontSetting>): FontSetting => ({
  value: null,
  default: "Manrope",
  ...opts,
});

const getSettingValues = (
  opts?: Partial<FontSettingValues>,
): FontSettingValues => ({
  "application-font": "Manrope",
  "application-font-files": null,
  ...opts,
});

async function clickSelect(text: string) {
  const input = screen.getByRole("searchbox");
  expect(input).toHaveValue(text);
  await userEvent.click(input);
}
