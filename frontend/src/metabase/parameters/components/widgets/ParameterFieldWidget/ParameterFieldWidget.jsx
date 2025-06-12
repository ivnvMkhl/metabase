import cx from "classnames";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { t } from "ttag";
import _ from "underscore";

import { useGetFavoriteListQuery } from "metabase/api/favorite";
import FieldValuesWidget from "metabase/components/FieldValuesWidget";
import Button from "metabase/core/components/Button";
import CS from "metabase/css/core/index.css";
import { favoriteFilters } from "metabase/dashboard/favoriteFIlters";
import { UpdateFilterButton } from "metabase/parameters/components/UpdateFilterButton";
import {
  WidgetRoot,
  Footer,
} from "metabase/parameters/components/widgets/Widget.styled";
import { Menu } from "metabase/ui/components/overlays/Menu";
import {
  getFilterArgumentFormatOptions,
  isEqualsOperator,
} from "metabase-lib/v1/operators/utils";
import { deriveFieldOperatorFromParameter } from "metabase-lib/v1/parameters/utils/operators";

import { normalizeValue } from "./normalizeValue";

const propTypes = {
  fields: PropTypes.array.isRequired,
  isEditing: PropTypes.bool.isRequired,
  parameter: PropTypes.object.isRequired,
  parameters: PropTypes.array.isRequired,
  setValue: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  question: PropTypes.object,
  dashboard: PropTypes.object,
};

export default function ParameterFieldWidget({
  value,
  setValue,
  isEditing,
  fields,
  parameter,
  parameters,
  question,
  dashboard,
}) {
  const [unsavedValue, setUnsavedValue] = useState(() => normalizeValue(value));
  const { data: favoriteGroups, isFetching, error } = useGetFavoriteListQuery();

  const operator = deriveFieldOperatorFromParameter(parameter);
  const { numFields = 1, multi = false, verboseName } = operator || {};
  const isEqualsOp = isEqualsOperator(operator);

  const supportsMultipleValues =
    multi && !parameter.hasVariableTemplateTagTarget;

  const isValid =
    unsavedValue.every(value => value != null) &&
    (supportsMultipleValues || unsavedValue.length === numFields);

  const handleSetFavoriteValues = favoriteGroup => () => {
    const values = JSON.parse(favoriteGroup.group_values) ?? [];
    const usedParameterFields = parameter.fields.map(field => field.id);
    const possibleValues = Object.values(dashboard.param_values).reduce(
      (acc, param_values) => {
        if (usedParameterFields.includes(param_values.field_id)) {
          return acc.concat(param_values.values);
        }
        return acc;
      },
      [],
    );

    const realValues = values.filter(value => possibleValues.includes(value));
    favoriteFilters.set(parameter.id, favoriteGroup.id);
    setUnsavedValue(realValues);
  };

  const availableFavoriteGroups = useMemo(() => {
    const usedParameterFields = parameter.fields.map(field => field.id);
    const possibleValues = Object.values(dashboard.param_values).reduce(
      (acc, param_values) => {
        if (usedParameterFields.includes(param_values.field_id)) {
          return acc.concat(param_values.values);
        }
        return acc;
      },
      [],
    );
    return favoriteGroups.filter(favoriteGroup => {
      const values = JSON.parse(favoriteGroup.group_values) ?? [];
      const realValues = values.filter(value => possibleValues.includes(value));
      return Boolean(realValues.length);
    });
  }, [favoriteGroups, dashboard.param_values, parameter.fields]);

  return (
    <WidgetRoot>
      <div className={CS.p1}>
        {verboseName && !isEqualsOp && (
          <div className={cx(CS.textBold, CS.mb1)}>{verboseName}...</div>
        )}

        {_.times(numFields, index => {
          const value = supportsMultipleValues
            ? unsavedValue
            : [unsavedValue[index]];
          const onValueChange = supportsMultipleValues
            ? newValues => {
                favoriteFilters.delete(parameter.id);
                setUnsavedValue(newValues);
              }
            : ([value]) => {
                const newValues = [...unsavedValue];
                newValues[index] = value;
                favoriteFilters.delete(parameter.id);
                setUnsavedValue(newValues);
              };
          return (
            <FieldValuesWidget
              key={index + String(value)}
              className={cx(CS.input, numFields - 1 !== index && CS.mb1)}
              value={value}
              parameter={parameter}
              parameters={parameters}
              question={question}
              dashboard={dashboard}
              onChange={onValueChange}
              placeholder={isEditing ? t`Enter a default value…` : undefined}
              fields={fields}
              autoFocus={index === 0}
              multi={supportsMultipleValues}
              formatOptions={
                operator && getFilterArgumentFormatOptions(operator, index)
              }
              color="brand"
              minWidth={300}
              maxWidth={400}
            />
          );
        })}
      </div>
      <Footer>
        {Boolean(availableFavoriteGroups.length) && (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button disabled={isFetching || error}>
                Добавить из избранного
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              {availableFavoriteGroups?.map(favoriteGroup => (
                <Menu.Item
                  Key={favoriteGroup.id}
                  onClick={handleSetFavoriteValues(favoriteGroup)}
                  icon={
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "4px",
                        background: favoriteGroup.color,
                      }}
                    />
                  }
                >
                  {favoriteGroup.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}

        <UpdateFilterButton
          value={value}
          unsavedValue={unsavedValue}
          defaultValue={parameter.default}
          isValueRequired={parameter.required ?? false}
          isValid={isValid}
          onClick={() => setValue(unsavedValue)}
        />
      </Footer>
    </WidgetRoot>
  );
}

ParameterFieldWidget.propTypes = propTypes;
