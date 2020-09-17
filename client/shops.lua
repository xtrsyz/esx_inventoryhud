local shopZone = nil

RegisterNetEvent("esx_inventoryhud:openShop")
AddEventHandler(
    "esx_inventoryhud:openShop",
    function(zone, items)
        setShopData(zone, items)
        openShop()
    end
)

function setShopData(zone, items)
    shopZone = zone

    SendNUIMessage(
        {
            action = "setInfoOther",
            label = 'Shop',
            id = zone,
            max = '~',
            used = '~',
        }
    )

    SendNUIMessage(
        {
            action = "setSecondInventoryItems",
            itemList = items
        }
    )
end

function openShop()
    loadPlayerInventory()
    isInInventory = true

    SendNUIMessage(
        {
            action = "display",
            type = "shop"
        }
    )

    SetNuiFocus(true, true)
end

RegisterNUICallback(
    "TakeFromShop",
    function(data, cb)
        if type(data.number) == "number" and math.floor(data.number) == data.number then
            local count = tonumber(data.number)

            if shopZone == "custom" then
                TriggerServerEvent("esx_inventoryhud:buyItem", data.item, count)
            else
                TriggerServerEvent("esx_shops:buyItem", data.item.name, count, shopZone)
            end
        end

        Wait(250)
        loadPlayerInventory()

        cb("ok")
    end
)
