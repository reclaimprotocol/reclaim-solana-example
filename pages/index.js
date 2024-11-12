import styles from "../styles/Home.module.css";
import { useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  BackpackWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  WalletConnectButton,
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import VerifyProofButton from "../components/verify-proof";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import QRCode from "react-qr-code";

export default function Home() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const wallet = useWallet();
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new SolflareWalletAdapter({ network })], []);
  const [ready, setReady] = useState(false);
  const [proof, setProof] = useState({});
  const [reclaimProofRequest, setReclaimProofRequest] = useState(null);
  const [requestUrl, setRequestUrl] = useState("");
  const [statusUrl, setStatusUrl] = useState("");

  useEffect(() => {
    async function initializeReclaim() {
      const APP_ID = "0x6E0338a6D8594101Ea9e13840449242015d71B19"; // This is an example App Id Replace it with your App Id.
      const APP_SECRET =
        "0x1e0d6a6548b72286d747b4ac9f2ad6b07eba8ad6a99cb1191890ea3f77fae48f"; // This is an example App Secret Replace it with your App Secret.
      const PROVIDER_ID = "6d3f6753-7ee6-49ee-a545-62f1b1822ae5"; // This is GitHub Provider Id Replace it with the provider id you want to use.

      const proofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );
      setReclaimProofRequest(proofRequest);
    }

    initializeReclaim();
  }, []);

  async function generateVerificationRequest() {
    if (!reclaimProofRequest) {
      console.error("Reclaim Proof Request not initialized");
      return;
    }
    const url = await reclaimProofRequest.getRequestUrl();
    setRequestUrl(url);
    const status = reclaimProofRequest.getStatusUrl();
    setStatusUrl(status);

    reclaimProofRequest.addContext(
      `user's address`,
      "for acmecorp.com on 1st january"
    );

    await reclaimProofRequest.startSession({
      onSuccessCallback: (proof) => {
        console.log("Verification success", proof);
        setProof(proof);
        setReady(true);
        // Your business logic here
      },
      onFailureCallback: (error) => {
        console.error("Verification failed", error);
        // Your business logic here to handle the error
      },
    });
  }

  return (
    <div>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets}>
          <WalletModalProvider>
            <div className={styles.App}>
              <WalletMultiButton />
              {!requestUrl && (
                <button onClick={generateVerificationRequest}>
                  Create Claim QrCode
                </button>
              )}
              {requestUrl && <QRCode value={requestUrl} />}

              {ready && <VerifyProofButton proof={proof} />}
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}
