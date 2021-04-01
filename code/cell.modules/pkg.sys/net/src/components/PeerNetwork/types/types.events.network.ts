import { t } from './common';

/**
 * NETWORK
 */
export type PeerNetworkEvent =
  | PeerNetworkInitReqEvent
  | PeerNetworkInitResEvent
  | PeerNetworkStatusRequestEvent
  | PeerNetworkStatusResponseEvent
  | PeerNetworkStatusChangedEvent
  | PeerNetworkOnlineChangedEvent
  | PeerNetworkPurgeReqEvent
  | PeerNetworkPurgeResEvent;

/**
 * Fires to initiate the creation of a Peer.
 */
export type PeerNetworkInitReqEvent = {
  type: 'Peer:Network/init:req';
  payload: PeerNetworkCreateReq;
};
export type PeerNetworkCreateReq = {
  self: t.PeerNetworkId;
  signal: string; // String containing the signal server endpoint: "host/path"
};

/**
 * Fires when a peer has connected.
 */
export type PeerNetworkInitResEvent = {
  type: 'Peer:Network/init:res';
  payload: PeerNetworkCreateRes;
};
export type PeerNetworkCreateRes = {
  self: t.PeerNetworkId;
  createdAt: number;
  signal: t.PeerNetworkSignalEndpoint;
};

/**
 * Fired to retrieve the status of the specified peer.
 */
export type PeerNetworkStatusRequestEvent = {
  type: 'Peer:Network/status:req';
  payload: PeerNetworkStatusRequest;
};
export type PeerNetworkStatusRequest = {
  self: t.PeerNetworkId;
};

/**
 * Fired to retrieve the status of the specified peer.
 */
export type PeerNetworkStatusResponseEvent = {
  type: 'Peer:Network/status:res';
  payload: PeerNetworkStatusResponse;
};
export type PeerNetworkStatusResponse = {
  self: t.PeerNetworkId;
  exists: boolean;
  network?: t.PeerNetworkStatus;
};

/**
 * Fired when the status of a peer network has changed.
 *
 * NOTE:
 *    This is a derived event that is fired in response
 *    to various different events completing that indicate
 *    the status of the [PeerNetwork] has changed.
 *
 *    Example usage: redrawing UI that may be displaying
 *    the status of the network.
 *
 */
export type PeerNetworkStatusChangedEvent = {
  type: 'Peer:Network/status:changed';
  payload: PeerNetworkStatusChanged;
};
export type PeerNetworkStatusChanged = {
  self: t.PeerNetworkId;
  network: t.PeerNetworkStatus;
  event: t.PeerEvent;
};

export type PeerNetworkOnlineChangedEvent = {
  type: 'Peer:Network/online:changed';
  payload: PeerNetworkOnlineChanged;
};
export type PeerNetworkOnlineChanged = {
  self: t.PeerNetworkId;
  isOnline: boolean;
};

/**
 * Purges obsolete state.
 */
export type PeerNetworkPurgeReqEvent = {
  type: 'Peer:Network/purge:req';
  payload: PeerNetworkPurgeReq;
};
export type PeerNetworkPurgeReq = {
  self: t.PeerNetworkId;
  select?: true | { closedConnections?: boolean }; // NB: [true] clears all purgeable data.
};

export type PeerNetworkPurgeResEvent = {
  type: 'Peer:Network/purge:res';
  payload: PeerNetworkPurgeRes;
};
export type PeerNetworkPurgeRes = {
  self: t.PeerNetworkId;
  changed: boolean;
  purged: t.PeerNetworkPurged;
  error?: t.PeerNetworkError;
};
export type PeerNetworkPurged = {
  closedConnections: { data: number; media: number };
};
