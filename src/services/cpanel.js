import axios from 'axios';

const CPanelService = axios.create({
  // baseURL: 'http://192.168.1.14:8001/api/v1',
  baseURL: 'https://cpanelnaj.najsistemas.com.br/public/api/v1',
});

export default CPanelService;
