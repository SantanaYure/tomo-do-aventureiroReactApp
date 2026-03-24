import type { ReactNode } from 'react'
import styles from './privacyContent.module.css'

export const PRIVACY_LAST_UPDATED = '23 de março de 2025'

export type PolicySection = {
  id: string
  title: string
  content: ReactNode
}

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    id: 'intro',
    title: '1. Introdução e Identificação do Controlador',
    content: (
      <>
        <p>
          O <strong>Tomo do Aventureiro</strong> ("Plataforma", "nós") é um aplicativo web para
          gerenciamento de fichas de personagens, monstros e NPCs para jogos de RPG de mesa. Esta
          Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus
          dados pessoais, em conformidade com a{' '}
          <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong>.
        </p>
        <p>
          <strong>Controlador dos dados:</strong> Tomo do Aventureiro
          <br />
          <strong>Contato do encarregado (DPO):</strong>{' '}
          <a href="mailto:privacidade@tomodoaventureiro.com.br" className={styles.link}>
            privacidade@tomodoaventureiro.com.br
          </a>
        </p>
        <p>
          Ao utilizar a Plataforma, você concorda com os termos desta Política. Caso não concorde,
          não utilize o serviço.
        </p>
      </>
    ),
  },
  {
    id: 'dados-coletados',
    title: '2. Dados Pessoais Coletados',
    content: (
      <>
        <p>Coletamos apenas os dados estritamente necessários para o funcionamento do serviço:</p>

        <h3 className={styles.subheading}>2.1 Dados fornecidos pelo usuário</h3>
        <ul className={styles.list}>
          <li><strong>Cadastro por e-mail:</strong> nome, sobrenome, endereço de e-mail e senha (armazenada em formato hash criptografado pelo Firebase Authentication).</li>
          <li><strong>Cadastro via Google:</strong> nome, sobrenome, e-mail e foto de perfil fornecidos pela conta Google, mediante consentimento expresso ao autorizar o acesso OAuth.</li>
          <li><strong>Conteúdo das fichas:</strong> dados que você insere nas fichas de personagens, monstros e NPCs (nomes fictícios, atributos, históricos, imagens de avatar em formato base64).</li>
        </ul>

        <h3 className={styles.subheading}>2.2 Dados coletados automaticamente</h3>
        <ul className={styles.list}>
          <li><strong>Identificador de usuário (UID):</strong> gerado automaticamente pelo Firebase Authentication para vincular seus dados ao seu perfil.</li>
          <li><strong>Metadados de sessão:</strong> data e hora de criação e atualização das fichas, armazenados no Firestore.</li>
          <li><strong>Dados técnicos:</strong> endereço IP e informações de dispositivo coletados pelo Firebase para fins de segurança e prevenção de fraudes.</li>
        </ul>

        <h3 className={styles.subheading}>2.3 Dados que NÃO coletamos</h3>
        <ul className={styles.list}>
          <li>Não coletamos dados de pagamento ou cartão de crédito.</li>
          <li>Não rastreamos sua navegação em outros sites.</li>
          <li>Não coletamos dados de localização geográfica precisa.</li>
          <li>Não coletamos dados sensíveis nos termos do art. 5º, II da LGPD.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'finalidade',
    title: '3. Finalidade e Base Legal do Tratamento',
    content: (
      <>
        <p>
          Todo tratamento de dados pessoais realizado pela Plataforma possui finalidade determinada
          e base legal prevista na LGPD:
        </p>
        <div className={styles.table}>
          <div className={`${styles.tableRow} ${styles.tableHeader}`}>
            <span>Finalidade</span>
            <span>Base Legal (LGPD)</span>
          </div>
          <div className={styles.tableRow}>
            <span>Autenticação e controle de acesso à conta</span>
            <span>Execução de contrato — art. 7º, V</span>
          </div>
          <div className={styles.tableRow}>
            <span>Armazenamento e sincronização das fichas em nuvem</span>
            <span>Execução de contrato — art. 7º, V</span>
          </div>
          <div className={styles.tableRow}>
            <span>Envio de e-mail de verificação de conta</span>
            <span>Execução de contrato — art. 7º, V</span>
          </div>
          <div className={styles.tableRow}>
            <span>Envio de e-mail de recuperação de senha</span>
            <span>Legítimo interesse / Execução de contrato — art. 7º, V e IX</span>
          </div>
          <div className={styles.tableRow}>
            <span>Segurança, prevenção de fraudes e abuso</span>
            <span>Legítimo interesse — art. 7º, IX</span>
          </div>
          <div className={styles.tableRow}>
            <span>Cumprimento de obrigação legal ou regulatória</span>
            <span>Obrigação legal — art. 7º, II</span>
          </div>
        </div>
        <p>
          Os dados <strong>não são utilizados</strong> para fins de publicidade, perfilamento
          comportamental, venda a terceiros ou qualquer finalidade incompatível com as descritas
          acima.
        </p>
      </>
    ),
  },
  {
    id: 'compartilhamento',
    title: '4. Compartilhamento de Dados',
    content: (
      <>
        <p>
          Seus dados pessoais podem ser compartilhados apenas com os seguintes prestadores de
          serviço, na condição de operadores, que atuam exclusivamente sob nossas instruções:
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Google Firebase (Google LLC):</strong> infraestrutura de autenticação
            (Firebase Authentication) e banco de dados em nuvem (Cloud Firestore), com servidores
            sujeitos às certificações ISO 27001 e SOC 2/3. A transferência internacional de dados
            para os EUA é amparada pelas Cláusulas Contratuais Padrão da Comissão Europeia,
            adotadas como garantia equivalente nos termos do art. 33 da LGPD.
          </li>
        </ul>
        <p>
          <strong>Não vendemos, alugamos nem cedemos seus dados</strong> a terceiros para fins
          comerciais. Podemos divulgar dados quando exigido por ordem judicial, autoridade
          competente ou obrigação legal, observados os limites da lei.
        </p>
      </>
    ),
  },
  {
    id: 'retencao',
    title: '5. Retenção e Exclusão dos Dados',
    content: (
      <>
        <ul className={styles.list}>
          <li>
            <strong>Dados de conta ativa:</strong> mantidos enquanto a conta existir e o serviço
            estiver sendo utilizado.
          </li>
          <li>
            <strong>Após exclusão da conta:</strong> os dados pessoais são eliminados ou
            anonimizados em até <strong>30 dias</strong>, salvo obrigação legal de retenção.
          </li>
          <li>
            <strong>Logs de segurança:</strong> retidos por até 6 meses para fins de prevenção de
            fraudes e atendimento a eventuais demandas legais.
          </li>
          <li>
            <strong>Backups:</strong> cópias de segurança automáticas do Firestore podem reter
            dados por até 7 dias adicionais após a exclusão, sendo eliminadas no ciclo seguinte.
          </li>
        </ul>
        <p>
          Para solicitar a exclusão antecipada de seus dados, entre em contato com o encarregado
          pelo endereço indicado na seção 1.
        </p>
      </>
    ),
  },
  {
    id: 'direitos',
    title: '6. Direitos do Titular dos Dados',
    content: (
      <>
        <p>
          Nos termos dos arts. 17 a 22 da LGPD, você possui os seguintes direitos em relação aos
          seus dados pessoais:
        </p>
        <ul className={styles.list}>
          <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessar uma cópia.</li>
          <li><strong>Correção:</strong> solicitar a atualização de dados incompletos, inexatos ou desatualizados.</li>
          <li><strong>Anonimização, bloqueio ou eliminação:</strong> quando o tratamento for desnecessário, excessivo ou realizado em desconformidade com a LGPD.</li>
          <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável, mediante requisição.</li>
          <li><strong>Eliminação dos dados tratados com consentimento:</strong> você pode revogar o consentimento a qualquer momento, sem prejuízo dos tratamentos realizados anteriormente.</li>
          <li><strong>Informação sobre compartilhamento:</strong> saber com quais entidades compartilhamos seus dados.</li>
          <li><strong>Oposição:</strong> opor-se a tratamentos realizados com base em legítimo interesse.</li>
          <li><strong>Revisão de decisões automatizadas:</strong> solicitar revisão humana de decisões tomadas exclusivamente com base em tratamento automatizado.</li>
          <li><strong>Petição à ANPD:</strong> apresentar reclamação à Autoridade Nacional de Proteção de Dados.</li>
        </ul>
        <p>
          Para exercer seus direitos, envie uma solicitação identificada para{' '}
          <a href="mailto:privacidade@tomodoaventureiro.com.br" className={styles.link}>
            privacidade@tomodoaventureiro.com.br
          </a>
          . Responderemos em até <strong>15 dias úteis</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'seguranca',
    title: '7. Segurança dos Dados',
    content: (
      <>
        <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:</p>
        <ul className={styles.list}>
          <li>Transmissão de dados por protocolo HTTPS/TLS.</li>
          <li>Autenticação gerenciada pelo Firebase Authentication com hash de senhas (bcrypt).</li>
          <li>Regras de segurança no Firestore que restringem o acesso de cada usuário exclusivamente aos seus próprios dados.</li>
          <li>Verificação de e-mail obrigatória antes do acesso ao conteúdo.</li>
          <li>Tokens de sessão com expiração automática.</li>
        </ul>
        <p>
          Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos
          titulares, notificaremos a ANPD e os usuários afetados nos prazos previstos pela LGPD.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '8. Cookies e Armazenamento Local',
    content: (
      <>
        <p>A Plataforma utiliza os seguintes mecanismos de armazenamento local:</p>
        <ul className={styles.list}>
          <li>
            <strong>localStorage / sessionStorage:</strong> utilizados para persistir preferências
            de interface (aba ativa, configurações visuais) e tokens de sessão do Firebase.
            Nenhum dado pessoal identificável é armazenado diretamente nestes mecanismos além
            do token de autenticação gerenciado pelo Firebase SDK.
          </li>
          <li>
            <strong>Cookies do Firebase Authentication:</strong> o Firebase pode definir cookies
            de sessão essenciais ao funcionamento da autenticação. Esses cookies não são
            utilizados para rastreamento ou publicidade.
          </li>
        </ul>
        <p>
          Não utilizamos cookies de terceiros para rastreamento ou publicidade comportamental.
        </p>
      </>
    ),
  },
  {
    id: 'menores',
    title: '9. Proteção de Menores de Idade',
    content: (
      <p>
        A Plataforma não é direcionada a crianças menores de 13 anos. Usuários entre 13 e 17 anos
        devem obter consentimento do responsável legal antes de criar uma conta. Caso identifiquemos
        que coletamos dados de menores sem o devido consentimento, excluiremos tais dados
        imediatamente. Entre em contato pelo e-mail indicado na seção 1 caso suspeite de situação
        desse tipo.
      </p>
    ),
  },
  {
    id: 'alteracoes',
    title: '10. Alterações desta Política',
    content: (
      <p>
        Podemos atualizar esta Política periodicamente para refletir mudanças no serviço ou na
        legislação aplicável. Alterações relevantes serão comunicadas por e-mail ou por aviso
        destacado na Plataforma com antecedência mínima de 15 dias. O uso continuado do serviço
        após a vigência das alterações implica aceitação da nova versão. A versão anterior ficará
        disponível mediante solicitação ao encarregado.
      </p>
    ),
  },
  {
    id: 'contato',
    title: '11. Contato e Canal de Atendimento ao Titular',
    content: (
      <>
        <p>Para dúvidas, solicitações de direitos ou reclamações relacionadas a esta Política:</p>
        <ul className={styles.list}>
          <li>
            <strong>E-mail do encarregado (DPO):</strong>{' '}
            <a href="mailto:privacidade@tomodoaventureiro.com.br" className={styles.link}>
              privacidade@tomodoaventureiro.com.br
            </a>
          </li>
          <li>
            <strong>Prazo de resposta:</strong> até 15 dias úteis após o recebimento da solicitação.
          </li>
          <li>
            <strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong>{' '}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className={styles.link}>
              www.gov.br/anpd
            </a>
          </li>
        </ul>
      </>
    ),
  },
]
