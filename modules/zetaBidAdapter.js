import * as utils from '../src/utils.js';
// import { config } from '../src/config.js';
import { registerBidder } from '../src/adapters/bidderFactory.js';
const BIDDER_CODE = 'Zeta Global';
const ENDPOINT_URL = 'http://ewr-337.ewr-rtb1.rfihub.com/prebid';
const DEFAULT_CUR = 'USD';

export const spec = {
  code: BIDDER_CODE,

  /**
     * Determines whether or not the given bid request is valid.
     *
     * @param {BidRequest} bid The bid params to validate.
     * @return boolean True if this is a valid bid, and false otherwise.
     */
  isBidRequestValid: function(bid) {
    return !!(bid.params.placementId || (bid.params.member && bid.params.invCode));
  },

  /**
     * Make a server request from the list of BidRequests.
     *
     * @param {validBidRequests[]} - an array of bidRequest objects
     * @param {bidderRequest} - master bidRequest object
     * @return ServerRequest Info describing the request to the server.
     */
  buildRequests: function(validBidRequests, bidderRequest) {
    const imps = [];
    const secure = location.protocol.indexOf('https') > -1 ? 1 : 0;
    const params = validBidRequests[0].params;
    utils._each(validBidRequests, function (bid) {
      let data = {
        id: bid.bidId,
        secure,
        banner: buildBanner(bid)
      };
      imps.push(data);
    });
    let isMobile = /(ios|ipod|ipad|iphone|android)/i.test(navigator.userAgent) ? 1 : 0;
    let payload = {
      id: bidderRequest.auctionId,
      cur: [DEFAULT_CUR],
      imp: imps,
      site: {
        mobile: isMobile,
        page: bidderRequest.refererInfo.referer
      },
      device: {
        ua: navigator.userAgent,
        ip: params.ip
      },
      user: {
        buyeruid: params.user.buyeruid,
        uid: params.user.uid
      }
      // bidderRequest: bidderRequest,
      // validBidRequests: validBidRequests
    };
    // utils.logMessage('payload generated');
    return {
      method: 'POST',
      url: ENDPOINT_URL,
      data: JSON.stringify(payload),
    };
  },

  /**
     * Unpack the response from the server into a list of bids.
     *
     * @param {ServerResponse} serverResponse A successful response from the server.
     * @return {Bid[]} An array of bids which were nested inside the server.
     */
  interpretResponse: function(serverResponse, bidRequest) {
    return serverResponse.body || {}
  },

  /**
     * Register the user sync pixels which should be dropped after the auction.
     *
     * @param {SyncOptions} syncOptions Which user syncs are allowed?
     * @param {ServerResponse[]} serverResponses List of server's responses.
     * @return {UserSync[]} The user syncs which should be dropped.
     */
  getUserSyncs: function(syncOptions, serverResponses, gdprConsent, uspConsent) {
    const syncs = []

    var gdprParams;
    if (typeof gdprConsent.gdprApplies === 'boolean') {
      gdprParams = `gdpr=${Number(gdprConsent.gdprApplies)}&gdpr_consent=${gdprConsent.consentString}`;
    } else {
      gdprParams = `gdpr_consent=${gdprConsent.consentString}`;
    }

    if (syncOptions.iframeEnabled) {
      syncs.push({
        type: 'iframe',
        // TODO: Change this sync URL to the Zeta URL
        url: '//acdn.adnxs.com/ib/static/usersync/v3/async_usersync.html?' + gdprParams
      });
    }
    if (syncOptions.pixelEnabled && serverResponses.length > 0) {
      syncs.push({
        type: 'image',
        url: serverResponses[0].body.userSync.url + gdprParams
      });
    }
    return syncs;
  },

  /**
     * Register bidder specific code, which will execute if bidder timed out after an auction
     * @param {data} Containing timeout specific data
     */
  onTimeout: function(data) {
    // Bidder specifc code
  },

  /**
     * Register bidder specific code, which will execute if a bid from this bidder won the auction
     * @param {Bid} The bid that won the auction
     */
  onBidWon: function(bid) {
    // Bidder specific code
  },

  /**
     * Register bidder specific code, which will execute when the adserver targeting has been set for a bid from this bidder
     * @param {Bid} The bid of which the targeting has been set
     */
  onSetTargeting: function(bid) {
    // Bidder specific code
  }
}

function buildBanner(bid) {
  let sizes = [];
  bid.mediaTypes && bid.mediaTypes.banner && bid.mediaTypes.banner.sizes ? sizes = bid.mediaTypes.banner.sizes : sizes = bid.sizes;
  return {
    w: sizes[0][0],
    h: sizes[0][1]
  };
}

registerBidder(spec);
