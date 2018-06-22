// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import {  default as Web3 } from 'web3';
import {  default as contract } from 'truffle-contract';

// Import our contract artifacts and turn them into usable abstractions.
import conference_artifacts from '../../build/contracts/Conference.json'

// Conference is our usable abstraction, which we'll use through the code below.
var Conference = contract(conference_artifacts);

var accounts, account, speaker;
var conference;

function getBalance(address) {
  return new Promise (function (resolve, reject) {
    web3.eth.getBalance(address, function (error, result) {
      if (error) {
reject(error); }
	else {
 resolve(web3.fromWei(result.toNumber(), 'Wei'));   }
  })
})
}

window.App = {
    start: function() {
        var self = this;

        web3.eth.getAccounts(function(err, accs) {
            if (err != null) {
                alert("There was an error fetching your accounts.");
                return;
            }

            if (accs.length == 0) {
                alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
                return;
            }
accounts = accs;
            //console.log(accounts);
            account = accounts[0];
            speaker = accounts[9];
            $("#orgBalance").html(getBalance(account));
            $("#speakerBalance").html(getBalance(speaker));
            self.initializeConference();
        });
    },

    initializeConference: function() {
        var self = this;
        Conference.deployed().then(function(instance) {
            conference = instance;
            $("#confAddress").html(conference.address);

            self.checkValues();
        }).catch(function(e) {
            console.log(e);
        });
    },

    checkValues: function() {
        Conference.deployed().then(function(instance) {
            conference = instance;
            conference.quota.call().then(
                function(quota) {
                    $("input#confQuota").val(quota);
                    return conference.organizer.call();
                }).then(
                function(organizer) {
                    //console.log("organizer "+organizer);
                    $("input#confOrganizer").val(organizer);
                    return conference.numRegistrants.call();
                }).then(
                function(num) {
                    $("#numRegistrants").html(num.toNumber());
                    return getBalance(conference.address);
 }).then(
                function(balance) {
                    $("#confBalance").html(balance);
                    return conference.speaker.call();
                }).then(
                function(speaker) {
                    $("input#speakerAddress").val(speaker);
                });
        }).catch(function(e) {
            console.log(e);
        });
    },
    changeQuota: function(val) {
        var conference;
        Conference.deployed().then(function(instance) {
            conference = instance;
            conference.changeQuota(val, {
                from: accounts[0]
            }).then(
                function() {
                    return conference.quota.call();
                }).then(
                function(quota) {
                    if (quota == val) {
                        var msgResult;
                        msgResult = "Change successful";
                    } else {
                        msgResult = "Change failed";
                    }
                    $("#changeQuotaResult").html(msgResult);
                });
        }).catch(function(e) {
            console.log(e);
        });
    },

    buyTicket: function(buyerAddress, ticketPrice) {
        var self = this;
        Conference.deployed().then(function(instance) {
conference = instance;
            conference.buyTicket({
                from: buyerAddress,
                value: ticketPrice
            }).then(
                function() {
                    return conference.numRegistrants.call();
                }).then(
                function(num) {
                    $("#numRegistrants").html(num.toNumber());
                    return conference.registrantsPaid.call(buyerAddress);
                }).then(
                function(valuePaid) {
                    var msgResult;
                    if (valuePaid.toNumber() == ticketPrice) {
                        msgResult = "Purchase successful";
                    } else {
                        msgResult = "Purchase failed";
                    }
                    $("#buyTicketResult").html(msgResult);
                }).then(
                function() {
                    $("#confBalance").html(getBalance(conference.address));
                });
        }).catch(function(e) {
            console.log(e);
        });
    },

    buyMultipleTickets: function(buyerAddress, ticketPrice, ticketcount) {
        var self = this;
        Conference.deployed().then(function(instance) {
            conference = instance;
            conference.buyMultipleTickets(ticketcount, {
                from: buyerAddress,
                value: ticketcount * ticketPrice
            }).then(
                function() {
                    return conference.numRegistrants.call();
}).then(
                function(num) {
                    $("#numRegistrants").html(num.toNumber());
                    return conference.registrantsPaid.call(buyerAddress);
                }).then(
                function(valuePaid) {
                    var msgResult;
                    if (valuePaid.toNumber() == ticketcount * ticketPrice) {
                        msgResult = "Purchase successful";
                    } else {
                        msgResult = "Purchase failed";
                    }
                    $("#buyTicketsResult").html(msgResult);
                }).then(
                function() {
                    $("#confBalance").html(getBalance(conference.address));
                });
        }).catch(function(e) {
            console.log(e);
        });
    },

    refundTicket: function(buyerAddress, ticketPrice) {
        var self = this;
        Conference.deployed().then(function(instance) {
            conference = instance;
            var msgResult;

            conference.registrantsPaid.call(buyerAddress).then(
                function(result) {
                    if (result.toNumber() == 0) {
                        $("#refundTicketResult").html("Buyer is not registered - no refund!");
                    } else {
                        conference.refundTicket(buyerAddress,
                            ticketPrice, {
                                from: accounts[0]
                            }).then(
                            function() {
                                return conference.numRegistrants.call();
  }).then(
                            function(num) {
                                $("#numRegistrants").html(num.toNumber());
                                return conference.registrantsPaid.call(buyerAddress);
                            }).then(
                            function(valuePaid) {
                                if (valuePaid.toNumber() == 0) {
                                    msgResult = "Refund successful";
                                } else {
                                    msgResult = "Refund failed";
                                }
                                $("#refundTicketResult").html(msgResult);
                            }).then(
                            function() {
                                $("#confBalance").html(getBalance(conference.address));
                            });
                    }
                });
        }).catch(function(e) {
            console.log(e);
        });
    }, //end of refund

    destroyContract: function() {
        var self = this;
        Conference.deployed().then(function(instance) {
            conference = instance;
            conference.destroy({
                from: accounts[0]
            }).then(
                function() {
                    $("#destroyContractResult").html("contract destroyed. pls refresh page to reflect balance");
                }); //end of conference destroy
        }).catch(function(e) {
            console.log(e);
        });
    }
};
window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    Conference.setProvider(web3.currentProvider);
    App.start();

    // Wire up the UI elements
    $("#changeQuota").click(function() {
        var val = $("#confQuota").val();
        App.changeQuota(val);
    });

    $("#buyTicket").click(function() {
        var val = $("#ticketPrice").val();
        var buyerAddress = $("#buyerAddress").val();
        App.buyTicket(buyerAddress, web3.toWei(val));
    });
    $("#buyTickets").click(function() {
        var val = $("#ticketPrice").val();
        var ticketcount = $("#ticketsCount").val();
        var buyerAddress = $("#mbuyerAddress").val();
App.buyMultipleTickets(buyerAddress, web3.toWei(val), ticketcount);
    });
    $("#refundTicket").click(function() {
        var val = $("#ticketPrice").val();
        var buyerAddress = $("#refBuyerAddress").val();
        App.refundTicket(buyerAddress, web3.toWei(val));
    });
    $("#destroyContract").click(function() {
        App.destroyContract();
    });

});

