import type { FC, ReactNode } from "react";

import {
  ContainerPadding,
  DashboardHeader,
  Divider,
  ExportContainerWrapper,
} from "./ExportContainer.styled";

type ExportContainerProps = {
  children?: ReactNode;
  format?: "a4" | "a3";
  orientation?: "p" | "l";
  title: string;
};

export const EXPORT_NODE_ID = "customExportNode";

const ExportContainer: FC<ExportContainerProps> = ({
  children,
  format = "a3",
  orientation = "l",
  title,
}) => {
  return (
    <>
      <ContainerPadding
        format={format}
        orientation={orientation}
        id={EXPORT_NODE_ID}
      >
        <ExportContainerWrapper>
          <DashboardHeader>{title}</DashboardHeader>
          {children}
        </ExportContainerWrapper>
      </ContainerPadding>
      <Divider />
    </>
  );
};

export { ExportContainer };
