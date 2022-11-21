import React from 'react';
import PropTypes from 'prop-types';

import ReadMore from './ReadMore';
import { commonErrors, commonErrorTypes } from '../lib/commonErrors';

const ErrorField = ({ ping }) => {
  if (!ping.error) {
    return <td className='error'></td>;
  }

  let errorTooltip = undefined;
  let errorText = ping.errorType + ' ' + ping.errorMessage;

  const matchingCommonError = commonErrors.find((e) => {
    return ping.errorMessage.startsWith(e[0]);
  });
  if (matchingCommonError) {
    errorText = matchingCommonError[1] + ': ' + errorText;
    errorTooltip = matchingCommonError[2];
  }
  const matchingCommonErrorType = commonErrorTypes.find((et) => {
    return ping.errorType === et[0];
  });
  if (matchingCommonErrorType) {
    errorTooltip = matchingCommonErrorType[1] + '\n\n' + ping.errorMessage;
  }

  // hack to force overflow of compacted json strings
  errorText = errorText.replace(/":"/g, '": "');
  errorText = errorText.replace(/","/g, '", "');

  const infoIcon = errorTooltip ? (
    <i
      className='fa fa-info-circle'
      data-toggle='tooltip'
      data-placement='top'
      title={errorTooltip}
    />
  ) : (
    ''
  );

  return (
    <td className='text-danger text-monospace error'>
      <ReadMore lines={3}>
        <p className='cell-overflow'>{errorText}</p>
      </ReadMore>
      {infoIcon}
    </td>
  );
};

ErrorField.propTypes = {
  ping: PropTypes.object.isRequired
};

export default ErrorField;