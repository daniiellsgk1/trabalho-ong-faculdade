# Impacta ONG — Plataforma Web

Projeto estático desenvolvido com HTML5, CSS3 e JavaScript para a primeira entrega de fundamentos e estruturação da plataforma digital da ONG.

## Estrutura

- `index.html`: página institucional com missão, histórico, indicadores, galeria multimídia e contato.
- `projetos.html`: catálogo de projetos, oportunidades de voluntariado, vídeo institucional e dados de captação.
- `cadastro.html`: formulário completo para voluntários e orientações para doadores.
- `css/`: estilos globais e responsivos.
- `js/`: scripts para utilidades gerais e máscaras de formulário.
- `assets/`: ícones, imagens otimizadas em JPG/WebP, vídeo institucional (MP4/WebM) e documentos auxiliares.

## Recursos implementados

- Semântica HTML5 completa, hierarquia correta de títulos e navegação acessível.
- Layout responsivo (mobile-first) com foco em acessibilidade (WCAG 2.1 AA) e contraste adequado.
- Imagens otimizadas com suporte a múltiplos formatos (`picture` com WebP e fallback JPG).
- Formulário com validação nativa, agrupamentos lógicos (`fieldset`) e máscaras para CPF, telefone e CEP.
- Melhorias de desempenho (lazy-loading em imagens secundárias e pré-carregamento de CSS).

## Validação recomendada

Para garantir conformidade com o W3C Validator, submeta cada arquivo HTML individualmente:

1. Acesse <https://validator.w3.org/>.
2. Utilize a aba **Validate by File Upload**.
3. Envie `index.html`, `projetos.html` e `cadastro.html` separadamente.
