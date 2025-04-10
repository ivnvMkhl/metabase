import styled from "@emotion/styled";

import { color } from "metabase/lib/colors";

export const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const AppContentContainer = styled.div<{
  isAdminApp: boolean;
}>`
  flex-grow: 1;
  display: flex;
  flex-direction: ${props => (props.isAdminApp ? "column" : "row")};
  position: relative;
  overflow: hidden;
  background-color: ${props =>
    props.isAdminApp ? "var(--mb-color-bg-white)" : color("content")};

  @media print {
    height: 100%;
    overflow: visible !important;
  }
`;

export const AppContent = styled.main<{ showLogo: boolean }>`
  width: 100%;
  height: 100%;
  overflow: auto;

  ${({ showLogo }) =>
    showLogo
      ? `
  padding-bottom: 120px;
  background-image: url("app/img/sk_resident.svg");
  background-size: 60px;
  background-repeat: no-repeat;
  background-position: bottom 30px right 30px;`
      : ``}

  @media print {
    overflow: visible !important;
  }
`;
