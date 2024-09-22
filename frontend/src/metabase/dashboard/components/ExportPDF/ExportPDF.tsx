import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { connect, type ConnectedProps } from "react-redux";
import type { Route, WithRouterProps } from "react-router";
import _ from "underscore";

import { Error } from "metabase/core/components/Alert/Alert.stories";
import {
  getClickBehaviorSidebarDashcard,
  getDashboardBeforeEditing,
  getDashboardComplete,
  getDocumentTitle,
  getFavicon,
  getIsAdditionalInfoVisible,
  getIsAddParameterPopoverOpen,
  getIsDirty,
  getIsEditing,
  getIsEditingParameter,
  getIsHeaderVisible,
  getIsDashCardsLoadingComplete,
  getIsNavigatingBackToDashboard,
  getIsDashCardsRunning,
  getIsSharing,
  getLoadingStartTime,
  getParameterValues,
  getSelectedTabId,
  getSidebar,
  getSlowCards,
} from "metabase/dashboard/selectors";
import type {
  FetchDashboardResult,
  SuccessfulFetchDashboardResult,
} from "metabase/dashboard/types";
import title from "metabase/hoc/Title";
import titleWithLoadingTime from "metabase/hoc/TitleWithLoadingTime";
import { parseHashOptions } from "metabase/lib/browser";
import * as Urls from "metabase/lib/urls";
import { closeNavbar, setErrorPage } from "metabase/redux/app";
import { getIsNavbarOpen } from "metabase/selectors/app";
import {
  canManageSubscriptions,
  getUserIsAdmin,
} from "metabase/selectors/user";
import { Loader } from "metabase/ui";
import type { DashboardCard, DashboardId } from "metabase-types/api";
import type { State, StoreDashcard } from "metabase-types/store";

import * as dashboardActions from "../../actions";
import {
  DashboardEmptyState,
  DashboardEmptyStateWithoutAddPrompt,
} from "../Dashboard/DashboardEmptyState/DashboardEmptyState";
import { DashboardExportGridConnected } from "../DashboardExportGrid";

import { ExportContainer } from "./ExportContainer/ExportContainer";
import { ExportMenu } from "./ExportMenu/ExportMenu";
import type { ExportFormat, ExportOrientation } from "./ExportPDF.interfaces";

const mapStateToProps = (state: State) => {
  return {
    canManageSubscriptions: canManageSubscriptions(state),
    isAdmin: getUserIsAdmin(state),
    isNavbarOpen: getIsNavbarOpen(state),
    isEditing: getIsEditing(state),
    isSharing: getIsSharing(state),
    dashboardBeforeEditing: getDashboardBeforeEditing(state),
    isEditingParameter: getIsEditingParameter(state),
    isDirty: getIsDirty(state),
    dashboard: getDashboardComplete(state),
    slowCards: getSlowCards(state),
    parameterValues: getParameterValues(state),
    loadingStartTime: getLoadingStartTime(state),
    clickBehaviorSidebarDashcard: getClickBehaviorSidebarDashcard(state),
    isAddParameterPopoverOpen: getIsAddParameterPopoverOpen(state),
    sidebar: getSidebar(state),
    pageFavicon: getFavicon(state),
    documentTitle: getDocumentTitle(state),
    isRunning: getIsDashCardsRunning(state),
    isLoadingComplete: getIsDashCardsLoadingComplete(state),
    isHeaderVisible: getIsHeaderVisible(state),
    isAdditionalInfoVisible: getIsAdditionalInfoVisible(state),
    selectedTabId: getSelectedTabId(state),
    isNavigatingBackToDashboard: getIsNavigatingBackToDashboard(state),
  };
};
const mapDispatchToProps = {
  ...dashboardActions,
  closeNavbar,
  setErrorPage,
};

type OwnProps = {
  dashboardId?: DashboardId;
  route: Route;
  params: { slug: string };
  children?: ReactNode;
};

const getPageBottomRow = (
  format: ExportFormat,
  orientation: ExportOrientation,
) => {
  switch (format) {
    case "a4": {
      switch (orientation) {
        case "p":
          return 20;
        case "l":
          return 13;
      }
      break;
    }
    case "a3": {
      switch (orientation) {
        case "p":
          return 30;
        case "l":
          return 14;
      }
      break;
    }
  }
};

const getDashcardGroups = (
  dashcards: StoreDashcard[],
  pageMaxRows: number,
  appendCardsHeight = false,
): StoreDashcard[][] => {
  const { current, last, minLastStartRow, maxCurrentEndRow } =
    dashcards.reduce<{
      current: StoreDashcard[];
      minLastStartRow: number;
      maxCurrentEndRow: number;
      last: StoreDashcard[];
    }>(
      (acc, dashcard) => {
        const dashcardEndRow = dashcard.row + dashcard.size_y;
        if (dashcardEndRow > pageMaxRows) {
          return {
            ...acc,
            last: [...acc.last, dashcard],
            minLastStartRow: Math.min(dashcard.row, acc.minLastStartRow),
          };
        }
        return {
          ...acc,
          current: [...acc.current, dashcard],
          maxCurrentEndRow: Math.max(dashcardEndRow, acc.maxCurrentEndRow),
        };
      },
      {
        current: [],
        minLastStartRow: +Infinity,
        maxCurrentEndRow: 0,
        last: [],
      },
    );
  const updatedCurrent = appendCardsHeight
    ? current.map(dashcard => {
        const dashcardEndRow = dashcard.row + dashcard.size_y;
        if (dashcardEndRow === maxCurrentEndRow) {
          return { ...dashcard, size_y: pageMaxRows - dashcard.row };
        }
        return dashcard;
      })
    : current;
  if (!last.length) {
    return [updatedCurrent];
  }
  const updatedLastCards = last.map(dashcard => {
    return { ...dashcard, row: dashcard.row - minLastStartRow };
  });
  return [
    updatedCurrent,
    ...getDashcardGroups(updatedLastCards, pageMaxRows, appendCardsHeight),
  ];
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type ReduxProps = ConnectedProps<typeof connector>;
type DashboardAppProps = OwnProps & ReduxProps & WithRouterProps;

export function getDashboardId({ dashboardId, params }: DashboardAppProps) {
  if (dashboardId) {
    return dashboardId;
  }

  return Urls.extractEntityId(params.slug) as DashboardId;
}

const ExportPDFComponent: FC<DashboardAppProps> = props => {
  const {
    fetchDashboard,
    setErrorPage,
    addCardToDashboard,
    fetchDashboardCardData,
    dashboard,
    selectedTabId,
  } = props;
  const options = parseHashOptions(window.location.hash);
  const addCardOnLoad = options.add != null ? Number(options.add) : undefined;
  const isNightMode = false;

  const [exportFormat, setExportFormat] = useState<ExportFormat>("a4");
  const [exportOrientation, setExportOrientation] =
    useState<ExportOrientation>("p");
  const [appendCardsHeight, setAppendCardsHeight] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const dashboardId = getDashboardId(props);

  const currentTabDashcards = useMemo(() => {
    if (!dashboard || !Array.isArray(dashboard.dashcards)) {
      return [];
    }
    if (!selectedTabId) {
      return dashboard.dashcards;
    }
    return dashboard.dashcards.filter(
      (dc: DashboardCard) => dc.dashboard_tab_id === selectedTabId,
    );
  }, [dashboard, selectedTabId]);

  const tabHasCards = currentTabDashcards.length > 0;
  const dashboardHasCards = dashboard && dashboard.dashcards.length > 0;

  const handleChangeExportFormat = (format: ExportFormat) => {
    setExportFormat(format);
  };
  const handleChangeExportOrientation = (orientation: ExportOrientation) => {
    setExportOrientation(orientation);
  };

  const handleLoadDashboard = useCallback(
    async (dashboardId: DashboardId) => {
      const result = await fetchDashboard({
        dashId: dashboardId,
        queryParams: {},
        options: {
          clearCache: false,
        },
      });

      if (!isSuccessfulFetchDashboardResult(result)) {
        setErrorPage(result.payload);
        return;
      }

      try {
        const dashboard = result.payload.dashboard;
        if (addCardOnLoad != null) {
          addCardToDashboard({
            dashId: dashboardId,
            cardId: addCardOnLoad,
            tabId: dashboard.tabs?.[0]?.id ?? null,
          });
        }
      } catch (error) {
        if (error instanceof Response && error.status === 404) {
          setErrorPage({ ...error, context: "dashboard" });
        } else {
          console.error(error);
          setError(error);
        }
      }
    },
    [addCardOnLoad, addCardToDashboard, fetchDashboard, setErrorPage],
  );

  useEffect(() => {
    if (!isInitialized) {
      if (!dashboard) {
        handleLoadDashboard(dashboardId).then(() => setIsInitialized(true));
      }

      fetchDashboardCardData({
        reload: false,
        clearCache: true,
        loadAllCards: true,
      });
    }
  }, [
    dashboard,
    dashboardId,
    fetchDashboardCardData,
    handleLoadDashboard,
    isInitialized,
  ]);

  if (error) {
    return <Error>Ошибка загрузки дашборда</Error>;
  }

  if (!isInitialized) {
    return (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader />
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  if (!dashboardHasCards) {
    return <DashboardEmptyStateWithoutAddPrompt isNightMode={isNightMode} />;
  }
  if (!dashboardHasCards) {
    return (
      <DashboardEmptyState
        dashboard={dashboard}
        isNightMode={isNightMode}
        addQuestion={() => undefined}
        closeNavbar={closeNavbar}
      />
    );
  }
  if (dashboardHasCards && !tabHasCards) {
    return <DashboardEmptyStateWithoutAddPrompt isNightMode={isNightMode} />;
  }

  const pageMaxRows = getPageBottomRow(exportFormat, exportOrientation);

  if (!dashboard.tabs?.length) {
    const exportDashcardGroups = getDashcardGroups(
      dashboard.dashcards,
      pageMaxRows,
      appendCardsHeight,
    );
    return (
      <ExportMenu
        onChangeFormat={handleChangeExportFormat}
        onChangeOrientation={handleChangeExportOrientation}
        appendCardsHeight={appendCardsHeight}
        onChangeAppendCardsHeight={setAppendCardsHeight}
        format={exportFormat}
        orientation={exportOrientation}
        dashboardName={dashboard.name}
      >
        {exportDashcardGroups.map((dashcards, index) => {
          return (
            <ExportContainer
              key={String(index)}
              title={dashboard.name}
              format={exportFormat}
              orientation={exportOrientation}
            >
              <DashboardExportGridConnected
                key={dashboard.id}
                clickBehaviorSidebarDashcard={
                  props.clickBehaviorSidebarDashcard
                }
                isNightMode={isNightMode}
                isFullscreen={false}
                isEditingParameter={props.isEditingParameter}
                isEditing={props.isEditing}
                dashboard={{ ...dashboard, dashcards }}
                slowCards={props.slowCards}
                navigateToNewCardFromDashboard={
                  props.navigateToNewCardFromDashboard
                }
                selectedTabId={0}
              />
            </ExportContainer>
          );
        })}
      </ExportMenu>
    );
  }

  return (
    <ExportMenu
      onChangeFormat={handleChangeExportFormat}
      onChangeOrientation={handleChangeExportOrientation}
      appendCardsHeight={appendCardsHeight}
      onChangeAppendCardsHeight={setAppendCardsHeight}
      format={exportFormat}
      orientation={exportOrientation}
      dashboardName={dashboard.name}
    >
      {dashboard.tabs
        .filter(tab => tab.id === selectedTabId)
        .map(tab => {
          const exportDashcardGroups = getDashcardGroups(
            dashboard.dashcards.filter(
              dashcard => dashcard.dashboard_tab_id === tab.id,
            ),
            pageMaxRows,
            appendCardsHeight,
          );
          return exportDashcardGroups.map((dashcards, index) => {
            return (
              <ExportContainer
                key={`${tab.id}${index}`}
                title={dashboard.name}
                format={exportFormat}
                orientation={exportOrientation}
              >
                <DashboardExportGridConnected
                  clickBehaviorSidebarDashcard={
                    props.clickBehaviorSidebarDashcard
                  }
                  isNightMode={isNightMode}
                  isFullscreen={false}
                  isEditingParameter={props.isEditingParameter}
                  isEditing={props.isEditing}
                  dashboard={{ ...dashboard, dashcards }}
                  slowCards={props.slowCards}
                  navigateToNewCardFromDashboard={
                    props.navigateToNewCardFromDashboard
                  }
                  selectedTabId={tab.id}
                />
              </ExportContainer>
            );
          });
        })}
    </ExportMenu>
  );
};

export const ExportPDF = _.compose(
  connector,
  title(
    ({
      dashboard,
      documentTitle,
    }: Pick<ReduxProps, "dashboard" | "documentTitle">) => ({
      title: documentTitle || dashboard?.name,
      titleIndex: 1,
    }),
  ),
  titleWithLoadingTime("loadingStartTime"),
)(ExportPDFComponent);

function isSuccessfulFetchDashboardResult(
  result: FetchDashboardResult,
): result is SuccessfulFetchDashboardResult {
  const hasError = "error" in result;
  return !hasError;
}
