**1. Alterar a versão da APK no arquivo android\app\build.gradle, nas variáveis:**
- android.defaultConfig.versionCode => código incremental, apenas somar mais 1.
- android.defaultConfig.versionName => versão que aparece na play store, o valor é relativo às modificações.

**2. Gerar a APK de produção:**
- Abrir o terminal na pasta "android".
- (opcional) Rodar o comando "./gradlew clean" pra limpar toda a informação da APK gerada anteriormente, seja em produção ou a gerada pra testes.
- Rodar o comando "./gradlew assembleRelease", se ocorrer algum erro verificar a primeira mensagem de erro acusada no terminal, geralmente ela vai ser a mais descritiva.
- O arquivo gerado vai estar em "android/app/build/outputs/apk/app-release.apk".

**3. Fazer o upload da APK na play store:**
- Abrir o console da play store https://play.google.com/console
- Abrir o painel do app na listagem de apps.
- Em "Versões > Produção" criar um nova versão e adicionar o arquivo "app-release.apk" gerado no passo 2.