import * as ActionTypes from '../constants/actionTypes';
import _ from 'underscore';
import { get } from '../utils/fetch';
import { addNotification } from './notifications';
import { getSuccessMessage, getErrorMessage, getUploadSuccessMessage, getUploadErrorMessage } from '../constants/lang';
import { staticfilesAPIUrl, staticfileAPIUrl } from '../constants/api';

export function fetchStaticFiles(directory = '') {
  return (dispatch) => {
    dispatch({ type: ActionTypes.FETCH_STATICFILES_REQUEST});
    return get(
      staticfilesAPIUrl(directory),
      { type: ActionTypes.FETCH_STATICFILES_SUCCESS, name: 'files'},
      { type: ActionTypes.FETCH_STATICFILES_FAILURE, name: 'error'},
      dispatch
    );
  };
}

export function uploadStaticFiles(directory, files) {
  return (dispatch) => {
    _.each(files, file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const payload = JSON.stringify({
          encoded_content: reader.result.split('base64,')[1]
        });
        // send the put request
        return fetch(staticfileAPIUrl(directory, file.name), {
          method: 'PUT',
          body: payload
        })
        .then(data => {
          dispatch({ type: ActionTypes.PUT_STATICFILE_SUCCESS });
          dispatch(fetchStaticFiles(directory));
          dispatch(addNotification(
            getSuccessMessage(),
            getUploadSuccessMessage(file.name),
            'success'
          ));
        })
        .catch(error => {
          dispatch({
            type: ActionTypes.PUT_STATICFILE_FAILURE,
            error
          });
          dispatch(addNotification(
            getErrorMessage(),
            getUploadErrorMessage(),
            'error'
          ));
        });
      };
    });
  };
}

export function deleteStaticFile(directory, filename) {
  return (dispatch) => {
    return fetch(staticfileAPIUrl(directory, filename), {
      method: 'DELETE'
    })
    .then(data => {
      dispatch({ type: ActionTypes.DELETE_STATICFILE_SUCCESS });
      dispatch(fetchStaticFiles(directory));
    })
    .catch(error => dispatch({
      type: ActionTypes.DELETE_STATICFILE_FAILURE,
      error
    }));
  };
}
