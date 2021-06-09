import { takeLatest, call, put, all } from 'redux-saga/effects';
import { Alert } from 'react-native';
import * as RNFS from 'react-native-fs';

import CPanelService from '../../../services/cpanel';
import ADVService from '../../../services/adv';
import { refreshLogoAfter30Days } from '../../../utils/logo';

import {
  signInSuccess,
  loadingEnd,
  loadingStart,
  refreshDashboard,
  setAdv,
} from './actions';

export function* signIn({ payload }) {
  try {
    yield put(loadingStart());

    const { login, senha, device } = payload;

    const response = yield call(
      CPanelService.post,
      'auth/login?check_device=1',
      {
        login: login,
        password: senha,
        usuario_tipo_id: 3,
        ...device,
      },
    );

    const { naj, status_code } = response.data;

    if (String(status_code) === '200') {
      CPanelService.defaults.headers.common.Authorization = `Bearer ${naj.accessToken
        }`;

      ADVService.defaults.headers.common.Authorization = `Bearer ${naj.accessToken
        }`;

      yield put(signInSuccess(naj.accessToken, naj.user));
    } else {
      yield put(loadingEnd());

      Alert.alert('Atenção', 'CPF ou senha inválido(s)');
    }
  } catch (err) {
    yield put(loadingEnd());

    Alert.alert('Atenção', 'CPF ou senha inválido(s)');
  }
}

export function* changeAdv({ payload }) {
  yield put(loadingStart());

  const { adv } = payload;
  const url = String(adv.url_base).replace(/\/+$/, '');
  let ext = '/naj-adv-web/public';

  let newUrl = url;

  if (url.indexOf(ext) == -1) {
    newUrl = url + ext;
  }

  ADVService.defaults.baseURL = newUrl;
  //ADVService.defaults.baseURL = adv.url_base;
  if (adv.url_base[adv.url_base.length - 1] !== '/') {
    adv.url_base = adv.url_base + '/';
  }

  const _adv = { ...adv, url_base_original: adv.url_base, url_base: newUrl };

  try {
    const response = yield call(ADVService.get, 'api/v1/app/dashboard');

    const { naj, status_code } = response.data;

    if (String(status_code) === '200') {
      yield put(refreshDashboard(naj));

      const folderPath = `${RNFS.DocumentDirectoryPath}/${adv.codigo}`;

      yield call(RNFS.mkdir, folderPath);
      yield call(RNFS.mkdir, `${folderPath}/temp`);
      yield call(RNFS.mkdir, `${RNFS.DocumentDirectoryPath}/logos/${adv.codigo}`);

      refreshLogoAfter30Days(_adv, 'FORCE');


    } else {
      Alert.alert(
        'Atenção',
        '(1) Houve um erro ao consultar os dados do dashboard.',
      );
    }
  } catch (err) {
    Alert.alert('Atenção', '(2) Houve um erro ao consultar os dados do dashboard. ' + err.message);
  }

  try {
    yield call(ADVService.get, 'api/v1/app/monitora');
  } catch (err) { }

  yield put(setAdv(_adv));

  yield put(loadingEnd());
}

export default all([
  takeLatest('@auth/SIGN_IN_REQUEST', signIn),
  takeLatest('@auth/CHANGE_ADV', changeAdv),
]);
