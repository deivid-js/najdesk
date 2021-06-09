import { Alert } from 'react-native';
import * as RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';

export function getLogoPath(advCode) {
  //return `${RNFS.DocumentDirectoryPath}/${advCode}/logo.png`;
  return `${RNFS.DocumentDirectoryPath}/logos/${advCode}/logo.png`;
}

export function setLastAtt(advCode) {
  const now = moment().format();

  AsyncStorage.setItem(`@NAJ_AC/last_att_logo_${advCode}`, now);
}

export async function getLastAtt(advCode) {
  const lastAtt = await AsyncStorage.getItem(`@NAJ_AC/last_att_logo_${advCode}`);

  return lastAtt;
}

export async function refreshLogoAfter30Days(adv, force) {
  const filePath = getLogoPath(adv.codigo);
  const fileExists = await RNFS.exists(filePath);
  const lastAtt = await getLastAtt(adv.codigo);
  const finalUrl = adv.url_base_original.replace('/naj-adv-web/public', '');
  const duration = moment.duration(moment().diff(lastAtt));
  const diffDays = Math.floor(duration.asDays());
  const fromUrl = `${finalUrl}naj-cliente/public/imagens/logo_escritorio/logo_escritorio.png`;
  //Alert.alert('url', fromUrl);
  //const diffMinutes = Math.floor(duration.asMinutes());
  let exit = true;

  // se o arquivo não existe
  if (!fileExists || !lastAtt) {
    exit = false;
  }

  // se a diferença é maior ou igual a 29 dias
  if (lastAtt && diffDays >= 29) {
    exit = false;
  }

  if (exit && force !== 'FORCE') {
    return;
  }

  setLastAtt(adv.codigo);

  // se o arquivo existe ele é excluido
  if (fileExists) {
    await RNFS.unlink(filePath);
  }

  // fazendo o download
  RNFS.downloadFile({
    fromUrl: fromUrl,
    toFile: filePath,
  }).promise.then(res => {
    if (res.statusCode !== 200) {
      // o arquivo não existe...
      //console.tron.log('erro ao criar o arquivo');
    } else {
      //console.tron.log('arquivo criado com sucesso');
    }
  });
}
