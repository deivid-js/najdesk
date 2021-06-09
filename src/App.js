import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import OneSignal from 'react-native-onesignal';
import * as RNFS from 'react-native-fs';

import ADVService from './services/adv';

import Router from './routes';

import { setLastReceived } from './store/modules/notification/actions';
import { loadPesquisasAction } from './store/modules/auth/actions';

import './utils/setYup';
import './utils/calendar';
import './config/ReactotronConfig';

export default function App() {
  const dispatch = useDispatch();
  const adv = useSelector(state => state.auth.adv);
  const user = useSelector(state => state.auth.user);

  //OneSignal.init('5bd804ab-bdd2-439f-b4ed-77c29bc6f766'); // -> minha chave
  OneSignal.init('ebbc160a-a51d-4c13-b7bf-cff2dcfd3fa0'); // -> chave do nelson

  OneSignal.addEventListener('received', onReceived);
  OneSignal.addEventListener('opened', onOpened);
  OneSignal.addEventListener('ids', onIds);

  OneSignal.inFocusDisplaying(0);

  async function monitora() {
    try {
      await ADVService.get(`/api/v1/app/monitoraHome`);
    } catch (err) { /* console.tron.log(err); */ }
  }

  function onReceived(notification) {
    //console.tron.log('** onReceived');
    //console.tron.log(notification);
    const { notificationID, additionalData } = notification.payload;

    dispatch(setLastReceived({ ...additionalData, notificationID }));
  }

  function onOpened(openResult) {
    //console.tron.log('** onOpened');
    //console.tron.log(openResult);
    const { notificationID, additionalData } = openResult.notification.payload;
    const dataAction = additionalData?.action;

    if (dataAction && dataAction == '@ACT/new_message') {
      dispatch(setLastReceived({ ...additionalData, notificationID, action: '@ACT/open_chat' }));
      return;
    }

    const actions = [
      '@ACT/open_to_pay',
      '@ACT/open_to_receive',
      '@ACT/open_process_activities',
      '@ACT/open_activities',
    ];

    if (dataAction && actions.indexOf(dataAction) > -1) {
      dispatch(setLastReceived({ ...additionalData, notificationID }));
    }
  }

  function onIds(device) {
    const { userId } = device;

    AsyncStorage.setItem('@NAJ_AC/one_signal_device_id', userId);
  }

  async function checkFolderExists() {
    const folderPath = `${RNFS.DocumentDirectoryPath}/logos`;
    const folderExists = await RNFS.exists(folderPath);

    if (!folderExists) {
      await RNFS.mkdir(folderPath);
    }
  }

  async function loadPesquisas() {
    let _pesquisas = [];
    let newPesquisas = [];

    try {
      _pesquisas = await AsyncStorage.getItem(`@NAJ_AC/pesquisa_${adv.codigo}`);
      _pesquisas = JSON.parse(_pesquisas);
    } catch (_e) {
      _pesquisas = [];
    }

    if (!_pesquisas) {
      _pesquisas = [];
    }

    try {
      const res = await ADVService.get('api/v1/app/pesquisas');

      const { data } = res;

      data.resultado.forEach(p => {
        let pesq = _pesquisas.find(_p => String(_p.id) == String(p.id));
        if (pesq && String(pesq.respondido) == 'N') {
          let _item = {
            ...p,
            count: pesq.count,
          };
          newPesquisas.push(_item);
        }

        // se não existe, a gente cadastra
        if (!pesq) {
          let newP = { ...p, respondido: 'N', count: 0 };
          newPesquisas.push(newP);
          _pesquisas.push(newP);
        }
      });

      await AsyncStorage.setItem(`@NAJ_AC/pesquisa_${adv.codigo}`, JSON.stringify(_pesquisas));
    } catch (err) { }

    dispatch(loadPesquisasAction(newPesquisas));
  }

  useEffect(() => {
    if (adv?.url_base) {
      ADVService.defaults.baseURL = adv.url_base;

      if (user) {
        monitora();
      }

      loadPesquisas();
    }

    checkFolderExists();

    return () => {
      OneSignal.removeEventListener('received', onReceived);
      OneSignal.removeEventListener('opened', onOpened);
      OneSignal.removeEventListener('ids', onIds);
    };
  }, []);

  return <Router />;
}
