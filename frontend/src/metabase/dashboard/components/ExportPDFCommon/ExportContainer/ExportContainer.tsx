import type { FC, ReactNode } from "react";

import { ExportPageOverlay } from "../ExportPageOverlay/ExportPageOverlay";

import {
  ContainerPadding,
  DashboardHeader,
  DashboardSubtitle,
  DashbordTitle,
  Divider,
  ExportContainerWrapper,
} from "./ExportContainer.styled";

type ExportContainerProps = {
  children?: ReactNode;
  format?: "a4" | "a3";
  orientation?: "p" | "l";
  title: string;
  subtitle?: string;
};

export const EXPORT_NODE_ID = "customExportNode";

const ExportContainer: FC<ExportContainerProps> = ({
  children,
  format = "a3",
  orientation = "l",
  title,
  subtitle,
}) => {
  return (
    <>
      <ContainerPadding
        format={format}
        orientation={orientation}
        id={EXPORT_NODE_ID}
      >
        <ExportPageOverlay />
        <ExportContainerWrapper>
          <DashbordTitle>
            <DashboardHeader>{title}</DashboardHeader>
            <DashboardSubtitle>{subtitle}</DashboardSubtitle>
          </DashbordTitle>
          {children}
        </ExportContainerWrapper>
      </ContainerPadding>
      <Divider />
    </>
  );
};

export { ExportContainer };
