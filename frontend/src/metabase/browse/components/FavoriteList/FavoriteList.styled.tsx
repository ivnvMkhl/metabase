import styled from "@emotion/styled";

import Card from "metabase/components/Card";

export const FavoriteCard = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: none;
  gap: 28px;
  display: flex;
  flex-direction: column;

  &:hover {
    color: var(--mb-color-brand);
    cursor: pointer;
  }
`;

export const ColorMarker = styled.div<{ color?: string }>`
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: ${({ color }) => color};
`;

export const FavoriteWithLabel = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
