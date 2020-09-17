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
    } else if (event.data.action == "setSecondInventoryItems") {
        secondInventorySetup(event.data.itemList);
    } else if (event.data.action == "setInfoText") {
        $("#player-inv-label").html(event.data.label);
        $("#player-inv-id").html(event.data.id);
        $("#player-used").html(event.data.used);
        $("#player-max").html(event.data.max);
    } else if (event.data.action == "setInfoOther") {
        $("#other-inv-label").html(event.data.label);
        $("#other-inv-id").html(event.data.id);
        $("#other-used").html(event.data.used);
        $("#other-max").html(event.data.max);
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
    });
    makeDroppables();
}

function closeInventory() {
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