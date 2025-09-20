import { useState, type FC, type ReactNode } from "react";

import { Button, Select, Switch } from "metabase/ui";
import { saveFormatPdf } from "metabase/visualizations/lib/save-dashboard-format-pdf";

import { EXPORT_NODE_ID } from "../ExportContainer/ExportContainer";
import type { ExportFormat, ExportOrientation } from "../ExportPDF.interfaces";

import { Menu, Wrapper, SwitchWidthLabel } from "./ExportMenu.styled";

type ExportMenuProps = {
  children: ReactNode;
  onChangeOrientation: (orientation: ExportOrientation) => void;
  onChangeFormat: (format: ExportFormat) => void;
  appendCardsHeight: boolean;
  onChangeAppendCardsHeight: (appendCardsHeight: boolean) => void;
  format: ExportFormat;
  orientation: ExportOrientation;
  dashboardName: string;
};

const ExportMenu: FC<ExportMenuProps> = ({
  children,
  onChangeOrientation,
  onChangeFormat,
  appendCardsHeight,
  onChangeAppendCardsHeight,
  format,
  orientation,
  dashboardName,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    const exportNodes = document.querySelectorAll(`#${EXPORT_NODE_ID}`);
    await saveFormatPdf(exportNodes, dashboardName, format, orientation, () =>
      setIsExporting(false),
    );
  };

  return (
    <Wrapper>
      <Menu>
        <Select
          data={[
            { label: "A4", value: "a4" },
            { label: "A3", value: "a3" },
          ]}
          value={format}
          onChange={onChangeFormat}
        />
        <Select
          data={[
            { label: "Книжная", value: "p" },
            { label: "Альбомная", value: "l" },
          ]}
          value={orientation}
          onChange={onChangeOrientation}
        />
        <SwitchWidthLabel>
          <Switch
            checked={appendCardsHeight}
            onChange={event => onChangeAppendCardsHeight(event.target.checked)}
          />
          <span>Растягивать карточки до конца страницы</span>
        </SwitchWidthLabel>
        <Button
          disabled={isExporting}
          loading={isExporting}
          onClick={handleExport}
        >
          {isExporting ? "Экспортируем..." : "Экспортировать"}
        </Button>
      </Menu>
      {children}
    </Wrapper>
  );
};

export { ExportMenu };
