import styled from "@emotion/styled";

import Button from "metabase/core/components/Button";

export const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 12px;
  align-items: center;
`;

export const Tag = styled.label`
  display: flex;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid gray;
  font-weight: 700;
  align-items: center;
  text-wrap: nowrap;
`;

export const ColumnItemIcon = styled(Button)`
  margin-left: 6px;
  padding: 0;
  align-items: center;

  &:hover {
    background-color: unset;
  }
`;
