import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Gavel,
  Landmark,
  LockKeyhole,
  Network,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Wallet
} from "lucide-react";
import { ARC_CHAIN_ID, ARC_EXPLORER_URL, ARC_RPC_URL, ARC_USDC_ADDRESS } from "./config/arc";
import { campaigns } from "./data/campaigns";
import {
  type Address,
  connectWallet,
  getConnectedChainId,
  getUsdcBalance,
  hasInjectedWallet,
  isArcChain,
  supportCampaign,
  switchToArc
} from "./lib/ethereum";
import { formatCurrency, formatNumber, shortenAddress } from "./lib/format";

const liveCampaignAddress = import.meta.env.VITE_PROOFRA_CAMPAIGN_ADDRESS as Address | undefined;

type WalletState = {
  address?: Address;
  chainId?: number;
  balance?: string;
  status: string;
  busy: boolean;
};

const initialWalletState: WalletState = {
  status: "Ready",
  busy: false
};

export function App() {
  const [selectedCampaign, setSelectedCampaign] = useState(0);
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);
  const [supportAmount, setSupportAmount] = useState("100");
  const [draftGoal, setDraftGoal] = useState(12000);
  const [draftBond, setDraftBond] = useState(1500);
  const campaign = campaigns[selectedCampaign];

  const progress = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  const acceptedPayout = campaign.milestones
    .filter((milestone) => milestone.status === "Accepted")
    .reduce((sum, milestone) => sum + milestone.payout, 0);

  const draftMilestones = useMemo(
    () => [
      { title: "Working proof", payout: 10, amount: draftGoal * 0.1 },
      { title: "Backer alpha", payout: 25, amount: draftGoal * 0.25 },
      { title: "Public beta", payout: 35, amount: draftGoal * 0.35 },
      { title: "Launch delivery", payout: 30, amount: draftGoal * 0.3 }
    ],
    [draftGoal]
  );

  async function refreshWallet(address = wallet.address) {
    if (!address) {
      return;
    }

    const [chainId, balance] = await Promise.all([getConnectedChainId(), getUsdcBalance(address)]);

    setWallet((current) => ({
      ...current,
      address,
      chainId,
      balance: Number(balance.formatted).toLocaleString("en-US", {
        maximumFractionDigits: 2
      }),
      status: isArcChain(chainId) ? "Connected to Arc Testnet" : "Connected wallet is on another network"
    }));
  }

  async function handleConnect() {
    setWallet((current) => ({ ...current, busy: true, status: "Opening wallet" }));

    try {
      if (!hasInjectedWallet()) {
        throw new Error("Install an EVM wallet such as MetaMask, Rabby, Coinbase Wallet, or Rainbow.");
      }

      const address = await connectWallet();
      await switchToArc();
      await refreshWallet(address);
    } catch (error) {
      setWallet((current) => ({
        ...current,
        status: error instanceof Error ? error.message : "Wallet connection failed"
      }));
    } finally {
      setWallet((current) => ({ ...current, busy: false }));
    }
  }

  async function handleSwitchNetwork() {
    setWallet((current) => ({ ...current, busy: true, status: "Switching to Arc" }));

    try {
      await switchToArc();
      await refreshWallet();
    } catch (error) {
      setWallet((current) => ({
        ...current,
        status: error instanceof Error ? error.message : "Network switch failed"
      }));
    } finally {
      setWallet((current) => ({ ...current, busy: false }));
    }
  }

  async function handleSupport() {
    if (!wallet.address) {
      await handleConnect();
      return;
    }

    if (!liveCampaignAddress) {
      setWallet((current) => ({
        ...current,
        status: "Demo mode: add VITE_PROOFRA_CAMPAIGN_ADDRESS to send a live Arc contribution"
      }));
      return;
    }

    setWallet((current) => ({ ...current, busy: true, status: "Approving USDC" }));

    try {
      const hashes = await supportCampaign({
        account: wallet.address,
        campaignAddress: liveCampaignAddress,
        amount: supportAmount,
        receiptURI: `ipfs://proofra/${campaign.title.toLowerCase().replaceAll(" ", "-")}`
      });

      setWallet((current) => ({
        ...current,
        status: `Contribution sent: ${shortenAddress(hashes.contributeHash)}`
      }));
      await refreshWallet();
    } catch (error) {
      setWallet((current) => ({
        ...current,
        status: error instanceof Error ? error.message : "Contribution failed"
      }));
    } finally {
      setWallet((current) => ({ ...current, busy: false }));
    }
  }

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: unknown) => {
      const [address] = Array.isArray(accounts) ? accounts : [];
      if (typeof address === "string") {
        void refreshWallet(address as Address);
      } else {
        setWallet(initialWalletState);
      }
    };

    const handleChainChanged = () => {
      void refreshWallet();
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [wallet.address]);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Proofra home">
          <img src="/proofra-logo.png" alt="Proofra" />
        </a>

        <nav className="nav" aria-label="Primary navigation">
          <a href="#campaigns">Campaigns</a>
          <a href="#creator">Creator Studio</a>
          <a href="#protocol">Protocol</a>
        </nav>

        <button className="walletButton" onClick={handleConnect} disabled={wallet.busy}>
          <Wallet size={18} aria-hidden="true" />
          <span>{wallet.address ? shortenAddress(wallet.address) : "Connect"}</span>
        </button>
      </header>

      <main>
        <section className="workspace" id="campaigns">
          <div className="intro">
            <p className="eyebrow">Milestone crowdfunding on Arc</p>
            <h1>Fund progress, not promises.</h1>
            <p>
              Proofra keeps USDC inside campaign escrow and releases it in milestone payouts only after public proof,
              backer review, and dispute-safe settlement.
            </p>

            <div className="actionRow">
              <button className="primaryButton" onClick={handleSupport} disabled={wallet.busy}>
                <CircleDollarSign size={18} aria-hidden="true" />
                <span>Back selected campaign</span>
              </button>
              <a className="secondaryButton" href="#creator">
                <Plus size={18} aria-hidden="true" />
                <span>Create campaign</span>
              </a>
            </div>
          </div>

          <aside className="arcPanel" aria-label="Arc wallet status">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Arc Testnet</p>
                <h2>Settlement layer</h2>
              </div>
              <Network size={22} aria-hidden="true" />
            </div>

            <dl className="networkList">
              <div>
                <dt>Chain ID</dt>
                <dd>{ARC_CHAIN_ID}</dd>
              </div>
              <div>
                <dt>USDC ERC-20</dt>
                <dd>{shortenAddress(ARC_USDC_ADDRESS)}</dd>
              </div>
              <div>
                <dt>RPC</dt>
                <dd>{ARC_RPC_URL.replace("https://", "")}</dd>
              </div>
              <div>
                <dt>Balance</dt>
                <dd>{wallet.balance ? `${wallet.balance} USDC` : "Not connected"}</dd>
              </div>
            </dl>

            <div className="statusLine">
              <span className={isArcChain(wallet.chainId) ? "statusDot online" : "statusDot"} />
              <span>{wallet.status}</span>
            </div>

            <div className="panelActions">
              <button className="iconButton" onClick={() => void refreshWallet()} disabled={!wallet.address || wallet.busy}>
                <RefreshCcw size={17} aria-hidden="true" />
                <span>Refresh</span>
              </button>
              <button className="iconButton" onClick={handleSwitchNetwork} disabled={wallet.busy}>
                <Network size={17} aria-hidden="true" />
                <span>Arc</span>
              </button>
              <a className="iconButton" href={ARC_EXPLORER_URL} target="_blank" rel="noreferrer">
                <ArrowUpRight size={17} aria-hidden="true" />
                <span>Explorer</span>
              </a>
            </div>
          </aside>
        </section>

        <section className="campaignGrid">
          <div className="campaignList" aria-label="Campaign list">
            {campaigns.map((item, index) => {
              const Icon = item.icon;
              const itemProgress = Math.round((item.raised / item.goal) * 100);

              return (
                <button
                  className={`campaignCard ${selectedCampaign === index ? "active" : ""}`}
                  key={item.title}
                  onClick={() => setSelectedCampaign(index)}
                >
                  <span className="campaignIcon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="campaignMeta">
                    <span className="campaignTitle">{item.title}</span>
                    <span>{item.category}</span>
                  </span>
                  <span className="campaignProgress">{itemProgress}%</span>
                </button>
              );
            })}
          </div>

          <article className="campaignRoom">
            <div className="roomHeader">
              <div>
                <p className="eyebrow">{campaign.category}</p>
                <h2>{campaign.title}</h2>
                <p>{campaign.summary}</p>
              </div>
              <div className="creatorBadge">
                <BadgeCheck size={18} aria-hidden="true" />
                <span>{campaign.creator}</span>
              </div>
            </div>

            <div className="fundingBar" aria-label={`${progress}% funded`}>
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="metricGrid">
              <Metric icon={CircleDollarSign} label="Raised" value={`${formatCurrency(campaign.raised)} / ${formatCurrency(campaign.goal)}`} />
              <Metric icon={LockKeyhole} label="Creator bond" value={`${formatCurrency(campaign.bond)}`} />
              <Metric icon={Clock3} label="Review window" value={campaign.reviewWindow} />
              <Metric icon={ShieldCheck} label="Backers" value={formatNumber(campaign.backers)} />
            </div>

            <div className="supportBox">
              <div>
                <label htmlFor="supportAmount">USDC amount</label>
                <input
                  id="supportAmount"
                  inputMode="decimal"
                  value={supportAmount}
                  onChange={(event) => setSupportAmount(event.target.value)}
                />
              </div>
              <button className="primaryButton" onClick={handleSupport} disabled={wallet.busy}>
                <CircleDollarSign size={18} aria-hidden="true" />
                <span>Support with USDC</span>
              </button>
            </div>

            <div className="milestoneList">
              {campaign.milestones.map((milestone, index) => (
                <div className="milestoneRow" key={milestone.title}>
                  <div className="milestoneIndex">{index + 1}</div>
                  <div>
                    <div className="milestoneTop">
                      <h3>{milestone.title}</h3>
                      <span className={`statusPill ${milestone.status.toLowerCase().replace(" ", "")}`}>
                        {milestone.status}
                      </span>
                    </div>
                    <p>{milestone.evidence}</p>
                  </div>
                  <strong>{milestone.payout}%</strong>
                </div>
              ))}
            </div>
          </article>

          <aside className="proofPanel" id="protocol">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Proof state</p>
                <h2>{acceptedPayout}% released</h2>
              </div>
              <FileCheck2 size={22} aria-hidden="true" />
            </div>

            <div className="ruleStack">
              <Rule icon={LockKeyhole} title="Escrow first" text="Creators cannot withdraw the full raise directly." />
              <Rule icon={FileCheck2} title="Evidence hash" text="Milestone proof is anchored before funds move." />
              <Rule icon={Gavel} title="Bounded arbitration" text="Arbiters resolve outcomes without owning user funds." />
              <Rule icon={Landmark} title="Refund path" text={campaign.riskLimit} />
            </div>
          </aside>
        </section>

        <section className="creatorStudio" id="creator">
          <div className="studioCopy">
            <p className="eyebrow">Creator Studio</p>
            <h2>Design a campaign that is hard to fake and easy to verify.</h2>
            <p>
              Proofra pushes creators toward small first payouts, explicit evidence, locked bonds, and a review window
              before each USDC release.
            </p>
          </div>

          <div className="builder">
            <div className="builderControls">
              <label>
                Goal, USDC
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={draftGoal}
                  onChange={(event) => setDraftGoal(Number(event.target.value))}
                />
              </label>
              <label>
                Creator bond, USDC
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={draftBond}
                  onChange={(event) => setDraftBond(Number(event.target.value))}
                />
              </label>
            </div>

            <div className="draftSummary">
              <Metric icon={CircleDollarSign} label="Target" value={formatCurrency(draftGoal)} />
              <Metric icon={LockKeyhole} label="Bond ratio" value={`${Math.round((draftBond / draftGoal) * 100)}%`} />
              <Metric icon={Clock3} label="Review" value="72h" />
            </div>

            <div className="draftMilestones">
              {draftMilestones.map((milestone, index) => (
                <div className="draftRow" key={milestone.title}>
                  <span>{index + 1}</span>
                  <strong>{milestone.title}</strong>
                  <small>{formatCurrency(milestone.amount)} unlocked</small>
                  <em>{milestone.payout}%</em>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric(props: { icon: typeof CircleDollarSign; label: string; value: string }) {
  const Icon = props.icon;

  return (
    <div className="metric">
      <Icon size={18} aria-hidden="true" />
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function Rule(props: { icon: typeof CircleDollarSign; title: string; text: string }) {
  const Icon = props.icon;

  return (
    <div className="rule">
      <Icon size={18} aria-hidden="true" />
      <div>
        <strong>{props.title}</strong>
        <p>{props.text}</p>
      </div>
    </div>
  );
}
