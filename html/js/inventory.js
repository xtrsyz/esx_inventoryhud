var type = "normal";
var disabled = false;
var disabledFunction = null;

window.addEventListener("message", function (event) {
    if (event.data.action == "setWeight") {
        $("#weight").html(event.data.text);
    }
    if (event.data.action == "display") {
        type = event.data.type;
        disabled = false;

        if (type === "normal") {
            $("#other-right-data").hide();
        } else {
            $("#other-right-data").show();
        }

        $(".ui").fadeIn();
    } else if (event.data.action == "hide") {
        $("#dialog").dialog("close");
        $(".ui").fadeOut();
        $(".item").remove();
        $("#otherInventory").html("<div id=\"noSecondInventoryMessage\"></div>");
        $("#noSecondInventoryMessage").html(invLocale.secondInventoryNotAvailable);
    } else if (event.data.action == "setType") {
        type = event.data.type;
    } else if (event.data.action == "setItems") {
        inventorySetup(event.data.itemList, event.data.fastItems);

        $('.item').draggable({
            helper: 'clone',
            appendTo: 'body',
            zIndex: 99999,
            revert: 'invalid',
            start: function (event, ui) {
                if (disabled) {
                    $(this).stop();
                    return;
                }

                $(this).css('background-image', 'none');
                itemData = $(this).data("item");
                itemInventory = $(this).data("inventory");

                if (itemInventory == "second" || !itemData.canRemove) {
                    $("#drop").addClass("disabled");
                    $("#give").addClass("disabled");
                }

                if (itemInventory == "second" || !itemData.usable) {
                    $("#use").addClass("disabled");
                }
            },
            stop: function () {
                itemData = $(this).data("item");

                if (itemData !== undefined && itemData.name !== undefined) {
                    $(this).css('background-image', 'url(\'' + Config.imageHost + 'img/items/' + itemData.name + '.png\'');
                    $("#drop").removeClass("disabled");
                    $("#use").removeClass("disabled");
                    $("#give").removeClass("disabled");
                }
            }
        });

        $('.item').hover(
            function () {
                // in
                $('.Information').find('.info-name').html("");
                $('.Information').find('.info-uniqueness').html("");
                $('.Information').find('.info-meta').html("");
                $('.Information').hide();

                itemData = $(this).data("item");
                if (itemData !== undefined) {
                    $('.Information').find('.info-name').html(itemData.label.toUpperCase());
                    if (itemData.description !== undefined) {
                        $('.Information').find('.info-desc').html(itemData.description);
                    } else {
                        $('.Information').find('.info-desc').html("This Item Has No Information");
                    }

                    var qualityI = GetItemQualityList(itemData)
                    var serialI = GetItemSerialList(itemData)
                    if (itemData.description !== undefined) {
                        if (qualityI) {
                            if (serialI) {
                                $('.Information').find('.info-desc').html(itemData.description +'<br /> Serial number: ' + serialI + '<br /> Durability: ' + Number(qualityI));
                            } else {
                                $('.Information').find('.info-desc').html(itemData.description + '<br /> Durability: ' + Number(qualityI));
                            }
                        } else {
                            if (serialI) {
                                $('.Information').find('.info-desc').html(itemData.description +'<br /> Serial number: ' + serialI);
                            } else {
                                $('.Information').find('.info-desc').html(itemData.description);
                            }
                        }
                    } else {
                        if (qualityI) {
                            if (serialI) {
                                $('.Information').find('.info-desc').html('The item does not have any information. <br /> Serial number: ' + serialI + '<br /> Durability: ' + Number(qualityI));
                            } else {
                                $('.Information').find('.info-desc').html('The item does not have any information' + '<br /> Durability: ' + Number(qualityI));
                            }
                        } else {
                            if (serialI) {
                                $('.Information').find('.info-desc').html('The item does not have any information <br /> Seria number: ' + serialI);
                            } else {
                                $('.Information').find('.info-desc').html('The item does not have any information');
                            }
                        }
                    }

                    if (itemData.staticMeta !== undefined || itemData.staticMeta !== "") {
                        if (itemData.type === 1) {
                            $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key">Registered Owner</div> : <div class="meta-val">' + itemData.staticMeta.owner + '</div></div>');
                        } else if (itemData.itemId === 'license') {
                            $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key">Name</div> : <div class="meta-val">' + itemData.staticMeta.name + '</div></div>');
                            $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key">Issued On</div> : <div class="meta-val">' + itemData.staticMeta.issuedDate + '</div></div>');
                            $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key">Height</div> : <div class="meta-val">' + itemData.staticMeta.height + '</div></div>');
                            $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key">Date of Birth</div> : <div class="meta-val">' + itemData.staticMeta.dob + '</div></div>');
                            $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key">Phone Number</div> : <div class="meta-val">' + itemData.staticMeta.phone + '</div></div>');
                            $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key">Citizen ID</div> : <div class="meta-val">' + itemData.staticMeta.id + '-' + itemData.staticMeta.user + '</div></div>');

                            if (itemData.staticMeta.endorsements !== undefined) {
                                $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key">Endorsement</div> : <div class="meta-val">' + itemData.staticMeta.endorsements + '</div></div>');
                            }
                        } else if (itemData.itemId === 'gold') {
                            $('.Information').find('.info-meta').append('<div class="meta-entry"><div class="meta-key"></div> : <div class="meta-val">This Bar Has A Serial Number Engraved Into It Registered To San Andreas Federal Reserve</div></div>');
                        }
                    } else {
                        $('.Information').find('.info-meta').html("This Item Has No Information");
                    }
                    $('.Information').show();
                }
            },
            function () {
                // out
                $('.tooltip-div').hide();
                $('.tooltip-div').find('.tooltip-name').html("");
                $('.tooltip-div').find('.tooltip-uniqueness').html("");
                $('.tooltip-div').find('.tooltip-meta').html("");
            }
        );
    } else if (event.data.action == "setSecondInventoryItems") {
        secondInventorySetup(event.data.itemList);
    } else if (event.data.action == "setInfoText") {
        $("#player-inv-label").html(event.data.label);
        $("#player-inv-id").html(event.data.id);
        $("#player-used").html(event.data.used);
        $("#player-max").html(event.data.max);
        var barweight = event.data.used/event.data.max*100;
        $('#player-left-data').append('<div class="barweight"></div>');
        $('#player-left-data > .barweight').css('width', barweight + '%');
    } else if (event.data.action == "setInfoOther") {
        $("#other-inv-label").html(event.data.label);
        $("#other-inv-id").html(event.data.id);
        $("#other-used").html(event.data.used);
        $("#other-max").html(event.data.max);
        var barweight = event.data.used/event.data.max*100;
        $('#other-right-data').append('<div class="barweight"></div>');
        $('#other-right-data > .barweight').css('width', barweight + '%');
    } else if (event.data.action == "nearPlayers") {
        $("#nearPlayers").html("");

        $.each(event.data.players, function (index, player) {
            $("#nearPlayers").append('<button class="nearbyPlayerButton" data-player="' + player.player + '">' + player.label + ' (' + player.player + ')</button>');
        });

        $("#dialog").dialog("open");

        $(".nearbyPlayerButton").click(function () {
            $("#dialog").dialog("close");
            player = $(this).data("player");
            $.post("http://esx_inventoryhud/GiveItem", JSON.stringify({
                player: player,
                item: event.data.item,
                number: parseInt($("#count").val())
            }));
        });
    }
});

function GetItemQualityList(data) {
    if (data.info !== undefined && data.info.quality !== undefined) {
        return data.info.quality;
    } else {
        return false;
    }
}

function GetItemSerialList(data) {
    if (data.info !== undefined && data.info.serial !== undefined) {
        return data.info.serial;
    } else {
        return false;
    }
}

function makeDroppables(){
    $('.itemFast').droppable({
        drop: function (event, ui) {
            itemData = ui.draggable.data("item");
            itemInventory = ui.draggable.data("inventory");

            if (type === "normal" && (itemInventory === "main" || itemInventory === "fast") && (itemData.type === "item_weapon" || itemData.usable === true) ) {
                disableInventory(500);
                $.post("http://esx_inventoryhud/PutIntoFast", JSON.stringify({
                    item: itemData,
                    slot : $(this).data('slot')
                }));
            }
        }
    });
}

function fastSlotSetup(fastItems) {
    $("#playerInventoryFastItems").html("");
    var i;
    for (i = 1; i < 6 ; i++) { 
      $("#playerInventoryFastItems").append('<div class="slotFast">' +
        '<div data-slot="' + i + '" id="itemFast-' + i + '" class="item itemFast" >' +
            '<div class="keybind">' + i + '</div><div class="item-count"></div> <div class="item-name"></div> </div></div>');
    }
    $.each(fastItems, function (index, item) {
        count = setCount(item);
        $('#itemFast-' + item.slot).css("background-image",'url(\'' + Config.imageHost + 'img/items/' + item.name + '.png\')');
        $('#itemFast-' + item.slot).html('<div class="keybind">' + item.slot + '</div><div class="item-count">' + count + '</div> <div class="item-name">' + item.label + '</div>');
        $('#itemFast-' + item.slot).data('item', item);
        $('#itemFast-' + item.slot).data('inventory', "fast");

        var qualityI = GetItemQualityList(item)
        if (qualityI) {
            $('#itemFast-' + item.slot).append('<div class="item-quality"></div>');
            $('#itemFast-' + item.slot + ' > .item-quality').css('width', qualityI + '%');
            if (qualityI > 99) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 120)
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // yeşil
                $('#itemFast-' + item.slot + ' > .item-quality').html("PERFECT")
            } else if (qualityI < 100 && qualityI > 80) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 100)
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // yeşil
            } else if (qualityI < 81 && qualityI > 70) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 90);
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // Sarı
            } else if (qualityI < 71 && qualityI > 60) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 80);
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'rgb(218, 188, 21)'); // Sarı
            } else if (qualityI < 61 && qualityI > 50) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 70);
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'rgb(218, 188, 21)'); // sarı
            } else if (qualityI < 51 && qualityI > 40) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 60);
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 41 && qualityI > 30) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 50);
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 31 && qualityI > 20) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 40);
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 21 && qualityI > 10) {
                // $('#itemFast-' + item.slot + ' > .item-quality').css('width', 20);
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'rgba(151,44,44,0.9)');
            } else if (qualityI >= 0) {
                $('#itemFast-' + item.slot + ' > .item-quality').css('width', '100%');
                $('#itemFast-' + item.slot + ' > .item-quality').css('background-color', 'rgba(151,44,44,0.9)'); // kırmızı
                $('#itemFast-' + item.slot + ' > .item-quality').html("BROKEN");
            }
        }
    });
    makeDroppables();
}

function closeInventory() {
    $('.Information').find('.info-name').html("");
    $('.Information').find('.info-uniqueness').html("");
    $('.Information').find('.info-meta').html("");
    $('.Information').hide();
    $.post("http://esx_inventoryhud/NUIFocusOff", JSON.stringify({
        type: type
    }));
}

function inventorySetup(items, fastItems) {
    $("#playerInventory").html("");
    $.each(items, function (index, item) {
        count = setCount(item, false);

        var bgColor = "none";
        if (item.rare !== undefined) {
            if (item.rare == 1) {
                bgColor = "rgba(205, 127, 50, 0.4)";
            } else if (item.rare == 2) {
                bgColor = "rgba(192, 192, 192, 0.4)";
            } else if (item.rare == 3) {
                bgColor = "rgba(218, 165, 32, 0.4)";
            }
        }

        $("#playerInventory").append('<div class="slot" style="background-color: ' + bgColor + ';">' +
            '<div id="item-' + index + '" class="item" style = "background-image: url(\'' + Config.imageHost + 'img/items/' + item.name + '.png\')">' +
            '<div class="item-count">' + count + '</div> <div class="item-name">' + item.label + '</div> </div></div>');
        $('#item-' + index).data('item', item);
        $('#item-' + index).data('inventory', "main");
        var qualityI = GetItemQualityList(item)
        if (qualityI) {
            $('#item-' + index).append('<div class="item-quality"></div>');
            $('#item-' + index + ' > .item-quality').css('width', qualityI + '%');
            if (qualityI > 99) {
                // $('#item-' + index + ' > .item-quality').css('width', 120)
                $('#item-' + index + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // yeşil
                $('#item-' + index + ' > .item-quality').html("PERFECT")
            } else if (qualityI < 100 && qualityI > 80) {
                // $('#item-' + index + ' > .item-quality').css('width', 100)
                $('#item-' + index + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // yeşil
            } else if (qualityI < 81 && qualityI > 70) {
                // $('#item-' + index + ' > .item-quality').css('width', 90);
                $('#item-' + index + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // Sarı
            } else if (qualityI < 71 && qualityI > 60) {
                // $('#item-' + index + ' > .item-quality').css('width', 80);
                $('#item-' + index + ' > .item-quality').css('background-color', 'rgb(218, 188, 21)'); // Sarı
            } else if (qualityI < 61 && qualityI > 50) {
                // $('#item-' + index + ' > .item-quality').css('width', 70);
                $('#item-' + index + ' > .item-quality').css('background-color', 'rgb(218, 188, 21)'); // sarı
            } else if (qualityI < 51 && qualityI > 40) {
                // $('#item-' + index + ' > .item-quality').css('width', 60);
                $('#item-' + index + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 41 && qualityI > 30) {
                // $('#item-' + index + ' > .item-quality').css('width', 50);
                $('#item-' + index + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 31 && qualityI > 20) {
                // $('#item-' + index + ' > .item-quality').css('width', 40);
                $('#item-' + index + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 21 && qualityI > 10) {
                // $('#item-' + index + ' > .item-quality').css('width', 20);
                $('#item-' + index + ' > .item-quality').css('background-color', 'rgba(151,44,44,0.9)');
            } else if (qualityI >= 0) {
                $('#item-' + index + ' > .item-quality').css('width', '100%');
                $('#item-' + index + ' > .item-quality').css('background-color', 'rgba(151,44,44,0.9)'); // kırmızı
                $('#item-' + index + ' > .item-quality').html("BROKEN");
            }
        }
    });
    fastSlotSetup(fastItems);
}

function secondInventorySetup(items) {
    $("#otherInventory").html("");
    $.each(items, function (index, item) {
        count = setCount(item, true);

        var bgColor = "none";
        if (item.rare !== undefined) {
            if (item.rare == 1) {
                bgColor = "rgba(205, 127, 50, 0.4)";
            } else if (item.rare == 2) {
                bgColor = "rgba(192, 192, 192, 0.4)";
            } else if (item.rare == 3) {
                bgColor = "rgba(218, 165, 32, 0.4)";
            }
        }
        $("#otherInventory").append('<div class="slotfix" style="background-color: ' + bgColor + ';"><div id="itemOther-' + index + '" class="item" style = "background-image: url(\'' + Config.imageHost + 'img/items/' + item.name + '.png\')">' +
            '<div class="item-count">' + count + '</div> <div class="item-name">' + item.label + '</div> </div></div>');
        $('#itemOther-' + index).data('item', item);
        $('#itemOther-' + index).data('inventory', "second");
        var qualityI = GetItemQualityList(item)
        if (qualityI) {
            $('#itemOther-' + index).append('<div class="item-quality"></div>');
            $('#itemOther-' + index + ' > .item-quality').css('width', qualityI + '%');
            if (qualityI > 99) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 120)
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // yeşil
                $('#itemOther-' + index + ' > .item-quality').html("PERFECT")
            } else if (qualityI < 100 && qualityI > 80) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 100)
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // yeşil
            } else if (qualityI < 81 && qualityI > 70) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 90);
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'rgba(111,195,111,0.9)'); // Sarı
            } else if (qualityI < 71 && qualityI > 60) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 80);
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'rgb(218, 188, 21)'); // Sarı
            } else if (qualityI < 61 && qualityI > 50) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 70);
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'rgb(218, 188, 21)'); // sarı
            } else if (qualityI < 51 && qualityI > 40) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 60);
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 41 && qualityI > 30) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 50);
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 31 && qualityI > 20) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 40);
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'orange');
            } else if (qualityI < 21 && qualityI > 10) {
                // $('#itemOther-' + index + ' > .item-quality').css('width', 20);
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'rgba(151,44,44,0.9)');
            } else if (qualityI >= 0) {
                $('#itemOther-' + index + ' > .item-quality').css('width', '100%');
                $('#itemOther-' + index + ' > .item-quality').css('background-color', 'rgba(151,44,44,0.9)'); // kırmızı
                $('#itemOther-' + index + ' > .item-quality').html("BROKEN");
            }
        }
    });
}

function Interval(time) {
    var timer = false;
    this.start = function () {
        if (this.isRunning()) {
            clearInterval(timer);
            timer = false;
        }

        timer = setInterval(function () {
            disabled = false;
        }, time);
    };
    this.stop = function () {
        clearInterval(timer);
        timer = false;
    };
    this.isRunning = function () {
        return timer !== false;
    };
}

function disableInventory(ms) {
    disabled = true;

    if (disabledFunction === null) {
        disabledFunction = new Interval(ms);
        disabledFunction.start();
    } else {
        if (disabledFunction.isRunning()) {
            disabledFunction.stop();
        }

        disabledFunction.start();
    }
}

function setCount(item, second) {
    if (second && item.price !== undefined) {
        return "$" + formatMoney(item.price);
    }

    count = item.count

    if (item.limit > 0) {
        count = item.count + " / " + item.limit;
    }

    if (item.type === "item_weapon") {
        if (count == 0) {
            count = "";
        } else {
            count = '<img src="img/bullet.png" class="ammoIcon"> ' + item.count;
        }
    }

    if (item.type === "item_account" || item.type === "item_money") {
        count = formatMoney(item.count);
    }

    return count;
}

function formatMoney(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;

    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t);
};

$(document).ready(function () {
    $("#count").focus(function () {
        $(this).val("")
    }).blur(function () {
        if ($(this).val() == "") {
            $(this).val("1")
        }
    });

    $("body").on("keyup", function (key) {
        if (Config.closeKeys.includes(key.which)) {
            closeInventory();
        }
    });

    $('#use').droppable({
        hoverClass: 'hoverControl',
        drop: function (event, ui) {
            itemData = ui.draggable.data("item");

            if (itemData == undefined || itemData.usable == undefined) {
                return;
            }

            itemInventory = ui.draggable.data("inventory");

            if (itemInventory == undefined || itemInventory == "second") {
                return;
            }

            if (itemData.usable) {
                disableInventory(300);
                $.post("http://esx_inventoryhud/UseItem", JSON.stringify({
                    item: itemData
                }));
            }
        }
    });

    $('#playerInventory').on('dblclick', '.item', function () {
        itemData = $(this).data("item");

        if (itemData == undefined || itemData.usable == undefined) {
            return;
        }

        itemInventory = $(this).data("inventory");

        if (itemInventory == undefined || itemInventory == "second") {
            return;
        }

        if (itemData.usable) {
            disableInventory(300);
            $.post("http://esx_inventoryhud/UseItem", JSON.stringify({
                item: itemData
            }));
        }
    });

    $('#give').droppable({
        hoverClass: 'hoverControl',
        drop: function (event, ui) {
            itemData = ui.draggable.data("item");

            if (itemData == undefined || itemData.canRemove == undefined) {
                return;
            }

            itemInventory = ui.draggable.data("inventory");

            if (itemInventory == undefined || itemInventory == "second") {
                return;
            }

            if (itemData.canRemove) {
                disableInventory(300);
                $.post("http://esx_inventoryhud/GetNearPlayers", JSON.stringify({
                    item: itemData
                }));
            }
        }
    });

    $('#drop').droppable({
        hoverClass: 'hoverControl',
        drop: function (event, ui) {
            itemData = ui.draggable.data("item");

            if (itemData == undefined || itemData.canRemove == undefined) {
                return;
            }

            itemInventory = ui.draggable.data("inventory");

            if (itemInventory == undefined || itemInventory == "second") {
                return;
            }

            if (itemData.canRemove) {
                disableInventory(300);
                $.post("http://esx_inventoryhud/DropItem", JSON.stringify({
                    item: itemData,
                    number: parseInt($("#count").val())
                }));
            }
        }
    });

    $('#playerInventory').droppable({
        drop: function (event, ui) {
            itemData = ui.draggable.data("item");
            itemInventory = ui.draggable.data("inventory");

            if (itemInventory === "second") {
                disableInventory(500);
                $.post("http://esx_inventoryhud/TakeFrom" + type.charAt(0).toUpperCase() + type.slice(1), JSON.stringify({
                    item: itemData,
                    number: parseInt($("#count").val())
                }));
            } else if (type === "normal" && itemInventory === "fast") {
                disableInventory(500);
                $.post("http://esx_inventoryhud/TakeFromFast", JSON.stringify({
                    item: itemData
                }));
            }
        }
    });

    $('#otherInventory').droppable({
        drop: function (event, ui) {
            itemData = ui.draggable.data("item");
            itemInventory = ui.draggable.data("inventory");

            if (itemInventory === "main" || itemInventory === "fast") {
                disableInventory(500);
                $.post("http://esx_inventoryhud/PutInto" + type.charAt(0).toUpperCase() + type.slice(1), JSON.stringify({
                    item: itemData,
                    number: parseInt($("#count").val())
                }));
            }
        }
    });

    $("#count").on("keypress keyup blur", function (event) {
        $(this).val($(this).val().replace(/[^\d].+/, ""));
        if ((event.which < 48 || event.which > 57)) {
            event.preventDefault();
        }
    });
});

$.widget('ui.dialog', $.ui.dialog, {
    options: {
        // Determine if clicking outside the dialog shall close it
        clickOutside: false,
        // Element (id or class) that triggers the dialog opening 
        clickOutsideTrigger: ''
    },
    open: function () {
        var clickOutsideTriggerEl = $(this.options.clickOutsideTrigger),
            that = this;
        if (this.options.clickOutside) {
            // Add document wide click handler for the current dialog namespace
            $(document).on('click.ui.dialogClickOutside' + that.eventNamespace, function (event) {
                var $target = $(event.target);
                if ($target.closest($(clickOutsideTriggerEl)).length === 0 &&
                    $target.closest($(that.uiDialog)).length === 0) {
                    that.close();
                }
            });
        }
        // Invoke parent open method
        this._super();
    },
    close: function () {
        // Remove document wide click handler for the current dialog
        $(document).off('click.ui.dialogClickOutside' + this.eventNamespace);
        // Invoke parent close method 
        this._super();
    },
});