import React from 'react';
import {
    Alert,
    ActivityIndicator,
    View,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image as RNImage,
    Dimensions,
    Modal,
    TouchableHighlight,
    ToastAndroid
} from 'react-native';
import { useSelector } from 'react-redux';
import { encode } from 'base-64';

import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FileViewer from 'react-native-file-viewer';
import ImageZoom from 'react-native-image-pan-zoom';
import Image from 'react-native-scalable-image';

import * as RNFS from 'react-native-fs';
import * as Animatable from 'react-native-animatable';


import ADVService from '../services/adv';

// components
import NajContainer from '../components/NajContainer';
import NajText from '../components/NajText';
import { colors } from '../globals';

const AnimatedBtn = Animatable.createAnimatableComponent(TouchableOpacity)

export default function AttachmentProcessListScreen({ route }) {
    const { id } = route.params;

    const auth = useSelector(state => state.auth);
    const [attachments, setAttachments] = React.useState([]);
    const [hasLoadedAll, setHasLoadedAll] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    const [openedImageModal, setOpenedImageModal] = React.useState(false);
    const [currentUriImage, setCurrentUriImage] = React.useState(null);
    const [currentImageWidth, setCurrentImageWidth] = React.useState(null);
    const [currentImageHeight, setCurrentImageHeight] = React.useState(null);

    const [selectedId, setSelectedId] = React.useState(null);

    const [downloadInfo, setDownloadInfo] = React.useState({
        loading: false,
        name: '',
    });

    function handleLoadingMore() {
        if (hasLoadedAll)
            return;

        handleLoadData();
    }

    async function handleDownload(item) {
        if (downloadInfo.loading) {
            return ToastAndroid.show("Não é possível efeutar o download de multiplos arquivos ao mesmo tempo!", ToastAndroid.SHORT)
        }

        setDownloadInfo({
            loading: true,
            name: item.NOME_ARQUIVO,
        });

        setSelectedId(item.ID)

        let err = false;
        let alertMessage = 'Houve um erro ao efetuar o download do arquivo';

        try {

            let files = await RNFS.readDir(`${RNFS.DocumentDirectoryPath}/${auth.adv.codigo}`);

            const _fileName = `${item.ID}_${item.NOME_ARQUIVO}`;
            const filePath = `${RNFS.DocumentDirectoryPath}/${auth.adv.codigo}/${_fileName}`.replace(/:/g, '-');
           
            let itemFile = files.find(fl => fl.name === _fileName); // Buscando o arquivo

            // console.tron.log(itemFile);

            if (!itemFile) {// Verifica se já não baixou
                const res = await ADVService.post('/api/v1/app/processos/attachment/download', {
                    adv_id: auth.adv.codigo,
                    anexo_id: item.ID,
                });
    
                if (String(res.data.status_code) !== '200')
                    err = true;
    
                if (String(res.data.naj.existe) === '0')
                    alertMessage = 'Arquivo não encontrado no servidor';
    
                await RNFS.writeFile(filePath, res.data.naj.base64, 'base64');

                files = await RNFS.readDir(`${RNFS.DocumentDirectoryPath}/${auth.adv.codigo}`);
                itemFile = files.find(fl => fl.name === _fileName); // Buscando o arquivo
            }

            try {
                const extension = _fileName.split('.')[1]

                if (extension == 'png' || extension == 'jpg' || extension == 'jpeg' || extension == 'gif' || extension == 'tiff') {
                    const fileUri = `file://${itemFile.path}`;
                
                    openImageModal(fileUri);
                } else {
                    await FileViewer.open(itemFile.path, { showOpenWithDialog: true });
                }

            } catch (err) {
                setDownloadInfo({
                    loading: false,
                    name: '',
                });

                ToastAndroid.show("Não foi possível acessar os arquivos do dispositivo", ToastAndroid.SHORT)
            }
        } catch (errMsg) {
            err = true;
        }

        if (err)
            ToastAndroid.show(alertMessage, ToastAndroid.SHORT)

        setDownloadInfo({
            loading: false,
            name: '',
        });
    }

    function openImageModal(fileUri) {
        RNImage.getSize(fileUri, (width, height) => {
            setCurrentImageWidth(width);
            setCurrentImageHeight(height);
        });
    
        setCurrentUriImage(fileUri);
        setOpenedImageModal(true);
    }
    
    function closeImageModal() {
        setOpenedImageModal(false);
        setCurrentUriImage(null);
        setCurrentImageWidth(null);
        setCurrentImageHeight(null);
    }

    async function handleLoadData() {
        const key = encode(JSON.stringify({ CODIGO: id }));

        try {
            const { data } = await ADVService.get(
                `/api/v1/app/processos/${key}/attachment`,
            );

            setAttachments(data.resultado);

            if (data.resultado.length < 50)
                setHasLoadedAll(true);

        } catch (err) {
            ToastAndroid.show("Ops, não foi possivel buscar os anexos do processo!", ToastAndroid.SHORT)
        }

        setLoading(false);
    }

    function handleRenderItem({ item }) {
        let backgroundColor = item.ID === selectedId ? "#f1f1f1" : "#fff";

        return (
            <View style={{ backgroundColor: backgroundColor, paddingVertical: 5, paddingHorizontal: 10, flexDirection: 'row', }}>
                <View>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDownload(item)}>
                        <NajText
                            style={styles.attachText}
                            numberOfLines={3}
                            ellipsizeMode="middle">
                            {item.file_origin_name}
                        </NajText>
                        <MaterialIcon size={28} name="file-download" color="#999" />
                    </TouchableOpacity>
                </View>
                <View style={styles.rowItem}>
                    <NajText style={styles.nonInfoText}>Nome Arquivo</NajText>
                    <NajText
                        numberOfLines={1}
                        style={[styles.name, { paddingRight: 10 }]}>
                        {item.NOME_ARQUIVO}
                    </NajText>
                </View>

                <View>
                    <NajText style={styles.nonInfoText}>Data</NajText>
                    <NajText
                        numberOfLines={1}
                        style={[styles.name, { paddingRight: 10 }]}>
                        {item.DATA_ARQUIVO}
                    </NajText>
                </View>
            </View>
        );
    }

    function handleRenderFooter() {
        if (!loadingMore)
            return null;

        return handleRenderLoadingIndicator();
    }

    function handleRenderLoadingIndicator() {
        return (
            <View style={styles.loadingCotainer}>
                <ActivityIndicator color={colors.secundary} animating size="large" />
            </View>
        );
    }

    React.useEffect(() => {
        handleLoadData();
    }, []);

    return (
        <NajContainer style={styles.container}>
            {downloadInfo.loading && (
                <View style={styles.audioCounterContainer}>
                    <View style={{ flex: 1, paddingRight: 15 }}>
                        <NajText
                        style={{ color: '#fafafa' }}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        Efetuando download do arquivo:
                        </NajText>
                        <NajText
                        style={{ color: '#fafafa', fontWeight: 'bold' }}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        {downloadInfo.name || 'Nome do arquivo não encontrado'}
                        </NajText>
                    </View>
                    <ActivityIndicator color="#fafafa" animating size="large" />
                </View>
            )}

            <FlatList
                data={attachments}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                keyExtractor={({ ID }) => String(ID)}
                renderItem={handleRenderItem}
                extraData={selectedId}
                onEndReachedThreshold={0.5}
            />

            {/* MODAL DE ZOOM NA IMAGEM */}
            <Modal
                presentationStyle="overFullScreen"
                visible={openedImageModal}
                animationType="slide"
                transparent={true}>
                <TouchableHighlight
                    onPress={closeImageModal}
                    style={styles.fileImageFullCloseButton}>
                    <MaterialIcon size={44} name="close" color="#f1f1f1" />
                </TouchableHighlight>

                <View style={styles.fileImageFullContainer}>
                    <View style={styles.fileImageFull}>
                        {(currentUriImage && currentImageHeight && currentImageWidth && (
                        <ImageZoom
                            cropWidth={Dimensions.get('window').width}
                            cropHeight={Dimensions.get('window').height}
                            imageWidth={100}
                            imageHeight={120}>
                            <Image source={{ uri: currentUriImage }} width={100}/>
                        </ImageZoom>
                        ))}
                    </View>
                </View>
            </Modal>
        </NajContainer>
    );
}

// styles
const styles = StyleSheet.create({
    item: {
        backgroundColor: '#fff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        flexDirection: 'row',
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f1f1',
    },
    date: {
      fontWeight: 'bold',
      paddingRight: 10,
      fontSize: 14,
    },
    description: {
        flex: 1,
    },
    loadingMore: {
        padding: 20,
        backgroundColor: 'red',
    },
    loadingCotainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
    nonInfoText: {
        color: '#777',
    },
    rowItem: {
        marginLeft: 10,
        flex: 1,
    },
    fab: {
        width: 45,
        height: 45,
        backgroundColor: '#eaeaea',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: {
        	width: 1,
          	height: 3
        }
	},
    buttonDownload: {
        textAlignVertical: 'center',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
    },
    fileImageFullCloseButton: {
        top: 15,
        right: 15,
        zIndex: 9999,
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, .91)',
        padding: 5,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
    },
    fileImageFullContainer: {
        backgroundColor: 'rgba(0, 0, 0, .91)',
        flex: 1,
    },
    fileImageFull: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioCounterContainer: {
        backgroundColor: '#c00',
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});