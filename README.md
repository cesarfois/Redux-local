# PDF Compressor Automation

Uma ferramenta automatizada para compressão de PDFs com interface gráfica.

## Pré-requisitos
1. **Node.js**: Certifique-se de ter o Node.js instalado.
2. **Ghostscript**: A ferramenta de compressão principal.
   - Baixe e instale a versão **GPL Ghostscript** para Windows (64-bit).
   - Link: [Ghostscript Downloads](https://ghostscript.com/releases/gsdnld.html)
   - **IMPORTANTE**: Durante a instalação, ou após ela, certifique-se de que o executável (`gswin64c.exe`) esteja no **PATH** do sistema, ou que o script possa acessá-lo globalmente.

## Instalação
1. Abra o terminal na pasta do projeto:
   ```bash
   cd c:\Users\Acer\Desktop\Redux
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```

## Como Usar
1. Inicie o servidor:
   ```bash
   node server.js
   ```
   *Ou use `npm start` se preferir.*

2. Abra o navegador em: [http://localhost:3000](http://localhost:3000)

3. Na Interface:
   - **Pasta de Origem**: Digite o caminho da pasta onde você colocará os PDFs originais.
   - **Pasta de Destino**: Digite o caminho onde os PDFs comprimidos devem ser salvos.
   - **Qualidade**: Escolha o nível de compressão desejado.
   - Clique em **"Salvar Configuração"**.
   - Clique em **"Iniciar Monitoramento"**.

4. Teste:
   - Coloque um arquivo `.pdf` na *Pasta de Origem*.
   - Acompanhe o log na tela ("Logs do Sistema").
   - O arquivo comprimido aparecerá na *Pasta de Destino*.

## Resolução de Problemas
- **Erro "Failed to start Ghostscript"**: Significa que o Ghostscript não está instalado ou o comando `gswin64c` não foi encontrado no PATH do Windows.
- **Watcher error**: Verifique se os caminhos das pastas estão corretos e existem.
