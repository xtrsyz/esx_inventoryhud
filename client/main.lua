isInInventory = false
ESX = nil
local fastSlot = {}
local fastControl = {157,158,160,164,166}

function copyTable(data)
    local newTable = {}
    for key, value in pairs(data) do
        newTable[key] = value
    end
    return newTable
end
function ShowPlayerName( PlayerId )
    if Config.HidePlayerName then
        return ''
    else
        return GetPlayerName(PlayerId)
    end
end

Citizen.CreateThread(
    function()
        while ESX == nil do
            TriggerEvent(
                "esx:getSharedObject",
                function(obj)
                    ESX = obj
                end
            )
            Citizen.Wait(0)
        end
    end
)

Citizen.CreateThread(
    function()
        while true do
            Citizen.Wait(0)
            if IsControlJustReleased(0, Config.OpenControl) and IsInputDisabled(0) then
                openInventory()
            end
        end
    end
)

function openInventory()
    loadPlayerInventory()
    isInInventory = true
    SendNUIMessage(
        {
            action = "display",
            type = "normal"
        }
    )
    SetNuiFocus(true, true)
    ESX.UI.Menu.CloseAll()
end

RegisterNetEvent("esx_inventoryhud:doClose")
AddEventHandler("esx_inventoryhud:doClose", function()
    closeInventory()
end)

RegisterCommand('closeinv', function(source, args, raw)
    closeInventory()
end)

RegisterCommand('openinv', function(source, args, raw)
    openInventory()
end)

function closeInventory()
    isInInventory = false
    SendNUIMessage(
        {
            action = "hide"
        }
    )
    SetNuiFocus(false, false)
    ClearPedSecondaryTask(GetPlayerPed(-1))
end

RegisterNUICallback(
    "NUIFocusOff",
    function(data, cb)
        closeInventory()
        TriggerEvent("esx_inventoryhud:onClosedInventory", data.type)
        cb("ok")
    end
)

RegisterNUICallback(
    "GetNearPlayers",
    function(data, cb)
        local playerPed = PlayerPedId()
        local players, nearbyPlayer = ESX.Game.GetPlayersInArea(GetEntityCoords(playerPed), 3.0)
        local foundPlayers = false
        local elements = {}

        for i = 1, #players, 1 do
            if players[i] ~= PlayerId() then
                foundPlayers = true

                table.insert(
                    elements,
                    {
                        label = ShowPlayerName(players[i]),
                        player = GetPlayerServerId(players[i])
                    }
                )
            end
        end

        if not foundPlayers then
            TriggerEvent('esx:showNotification', _U("players_nearby"))
        else
            SendNUIMessage(
                {
                    action = "nearPlayers",
                    foundAny = foundPlayers,
                    players = elements,
                    item = data.item
                }
            )
        end

        cb("ok")
    end
)

RegisterNUICallback(
    "UseItem",
    function(data, cb)
		TriggerServerEvent("esx:useItem", data.item.name, data.item)

        if shouldCloseInventory(data.item.name) then
            closeInventory()
        else
            Citizen.Wait(250)
            loadPlayerInventory()
        end

        cb("ok")
    end
)

RegisterNUICallback(
    "DropItem",
    function(data, cb)
        if IsPedSittingInAnyVehicle(playerPed) then
            return
        end

        if type(data.number) == "number" and math.floor(data.number) == data.number then
			TriggerServerEvent("esx:removeInventoryItem", data.item.type, data.item.name, data.number, data.item)
        end

        Wait(250)
        loadPlayerInventory()

        cb("ok")
    end
)

RegisterNUICallback(
    "GiveItem",
    function(data, cb)
        local playerPed = PlayerPedId()
        local players, nearbyPlayer = ESX.Game.GetPlayersInArea(GetEntityCoords(playerPed), 3.0)
        local foundPlayer = false
        for i = 1, #players, 1 do
            if players[i] ~= PlayerId() then
                if GetPlayerServerId(players[i]) == data.player then
                    foundPlayer = true
                end
            end
        end

        if foundPlayer then
            local count = tonumber(data.number)

            if data.item.type == "item_weapon" then
                count = GetAmmoInPedWeapon(PlayerPedId(), GetHashKey(data.item.name))
            end

            if data.item.type == "item_money" then
				TriggerServerEvent("esx:giveInventoryItem", data.player, "item_account", "money", count)
			else
				TriggerServerEvent("esx:giveInventoryItem", data.player, data.item.type, data.item.name, count, data.item)
			end
            Wait(250)
            loadPlayerInventory()
        else
            TriggerEvent('esx:showNotification', _U("players_nearby"))
        end
        cb("ok")
    end
)

function shouldCloseInventory(itemName)
    for index, value in ipairs(Config.CloseUiItems) do
        if value == itemName then
            return true
        end
    end

    return false
end

function shouldSkipAccount(accountName)
    for index, value in ipairs(Config.ExcludeAccountsList) do
        if value == accountName then
            return true
        end
    end

    return false
end

function loadPlayerInventory()
    ESX.TriggerServerCallback(
        "esx_inventoryhud:getPlayerInventory",
        function(data)
            items = {}
            name = {}
            fastItems = {}
            inventory = data.inventory
            accounts = data.accounts
            money = data.money
            weapons = data.weapons
            weight = data.weight*0.001
            maxWeight = data.maxWeight*0.001

            SendNUIMessage(
                {
                    action = "setInfoText",
                    label = 'Inventory',
                    id = GetPlayerName(PlayerId()),
                    max = data.maxWeight,
                    used = data.weight,
                }
            )
            if Config.IncludeCash and money ~= nil and money > 0 then
                moneyData = {
                    label = _U("cash"),
                    name = "cash",
                    type = "item_money",
                    count = money,
                    usable = false,
                    rare = false,
                    limit = -1,
                    canRemove = true
                }
                table.insert(items, moneyData)
            end

            if Config.IncludeAccounts and accounts ~= nil then
                for key, value in pairs(accounts) do
                    if not shouldSkipAccount(accounts[key].name) then
                        local canDrop = accounts[key].name ~= "bank"

                        if accounts[key].money > 0 then
                            accountData = {
                                label = accounts[key].label,
                                count = accounts[key].money,
                                type = "item_account",
                                name = accounts[key].name,
                                usable = false,
                                rare = false,
                                limit = -1,
                                canRemove = canDrop
                            }
                            table.insert(items, accountData)
                        end
                    end
                end
            end

            if inventory ~= nil then
                for key, value in pairs(inventory) do
                    if value.count <= 0 then
                        value = nil
                    else
                        local total = value.count                            
                        value.type = "item_standard"

                        if value.batch then
							print('batch:'..json.encode(value))
                            for batch, item in pairs(value.batch) do
                                local found = false
                                total = total - item.count

                                local newData = copyTable(value)
                                newData.count = item.count
                                newData.info = item.info
                                newData.batch = batch
                                
                                
                                for slot, weapon in pairs(fastSlot) do
                                    if weapon.name == value.name and weapon.batch == batch then
                                        newData.slot = slot
                                        table.insert(fastItems, newData)
                                        found = true
                                        break
                                    end
                                end
                                if found == false then
                                    table.insert(items, newData)
                                end
                            end
							print('sisa:'..total)
                            if total > 0 then
                                value.count = total
                                value.batch = false
                                local found = false
                                for slot, weapon in pairs(fastSlot) do
                                    if weapon.name == value.name and not weapon.batch then
                                        value.slot = slot
                                        table.insert(fastItems, value)
                                        found = true
                                        break
                                    end
                                end
                                if found == false then
                                    table.insert(items, value)
                                end
                            end
                        else
							print('nobatch:'..json.encode(value))
                            value.type = "item_standard"
                            local found = false
                            for slot, weapon in pairs(fastSlot) do
                                if weapon.name == value.name and not weapon.batch then
                                    value.slot = slot
                                    table.insert(fastItems, value)
                                    found = true
                                    break
                                end
                            end
                            if found == false then
                                table.insert(items, value)
                            end
                        end
                    end
                end
            end

            if Config.IncludeWeapons and weapons ~= nil then
                for key, value in pairs(weapons) do
                    local weaponHash = GetHashKey(weapons[key].name)
                    local playerPed = PlayerPedId()
                    if weapons[key].name ~= "WEAPON_UNARMED" then

                        local found = false
                        for slot, weapon in pairs(fastSlot) do
                            if weapon.name == weapons[key].name then
                                table.insert(
                                    fastItems,
                                    {
                                        label = weapons[key].label,
                                        count = weapons[key].ammo,
                                        limit = -1,
                                        type = "item_weapon",
                                        name = weapons[key].name,
                                        usable = false,
                                        rare = false,
                                        canRemove = true,
                                        slot = slot
                                    }
                                )
                                found = true
                                break
                            end
                        end

                        if found == false then
                            table.insert(
                                items,
                                {
                                    label = weapons[key].label,
                                    count = weapons[key].ammo,
                                    limit = -1,
                                    type = "item_weapon",
                                    name = weapons[key].name,
                                    usable = false,
                                    rare = false,
                                    canRemove = true
                                }
                            )
                        end
                    end
                end
            end

            SendNUIMessage(
                {
                    action = "setItems",
                    itemList = items,
                    fastItems = fastItems,
                }
            )
        end,
        GetPlayerServerId(PlayerId())
    )
end

Citizen.CreateThread(
    function()
        while true do
            Citizen.Wait(1)
            if isInInventory then
                local playerPed = PlayerPedId()
                DisableControlAction(0, 1, true) -- Disable pan
                DisableControlAction(0, 2, true) -- Disable tilt
                DisableControlAction(0, 24, true) -- Attack
                DisableControlAction(0, 257, true) -- Attack 2
                DisableControlAction(0, 25, true) -- Aim
                DisableControlAction(0, 263, true) -- Melee Attack 1
                DisableControlAction(0, 32, true) -- W
                DisableControlAction(0, 34, true) -- A
                DisableControlAction(0, 31, true) -- S (fault in Keys table!)
                DisableControlAction(0, 30, true) -- D (fault in Keys table!)

                DisableControlAction(0, 45, true) -- Reload
                DisableControlAction(0, 22, true) -- Jump
                DisableControlAction(0, 44, true) -- Cover
                DisableControlAction(0, 37, true) -- Select Weapon
                DisableControlAction(0, 23, true) -- Also 'enter'?

                DisableControlAction(0, 288, true) -- Disable phone
                DisableControlAction(0, 289, true) -- Inventory
                DisableControlAction(0, 170, true) -- Animations
                DisableControlAction(0, 167, true) -- Job

                DisableControlAction(0, 0, true) -- Disable changing view
                DisableControlAction(0, 26, true) -- Disable looking behind
                DisableControlAction(0, 73, true) -- Disable clearing animation
                DisableControlAction(2, 199, true) -- Disable pause screen

                DisableControlAction(0, 59, true) -- Disable steering in vehicle
                DisableControlAction(0, 71, true) -- Disable driving forward in vehicle
                DisableControlAction(0, 72, true) -- Disable reversing in vehicle

                DisableControlAction(2, 36, true) -- Disable going stealth

                DisableControlAction(0, 47, true) -- Disable weapon
                DisableControlAction(0, 264, true) -- Disable melee
                DisableControlAction(0, 257, true) -- Disable melee
                DisableControlAction(0, 140, true) -- Disable melee
                DisableControlAction(0, 141, true) -- Disable melee
                DisableControlAction(0, 142, true) -- Disable melee
                DisableControlAction(0, 143, true) -- Disable melee
                DisableControlAction(0, 75, true) -- Disable exit vehicle
                DisableControlAction(27, 75, true) -- Disable exit vehicle
            end
        end
end)

-- HIDE WEAPON WHEEL
Citizen.CreateThread(function ()
    Citizen.Wait(2000)
    while true do
        Citizen.Wait(0)
        HideHudComponentThisFrame(19)
        HideHudComponentThisFrame(20)
        BlockWeaponWheelThisFrame()
        DisableControlAction(0, 37,true)
    end
end)

RegisterNetEvent("esx_inventoryhud:closeInventory")
AddEventHandler(
    "esx_inventoryhud:closeInventory",
    function()
        closeInventory()
    end
)

RegisterNetEvent("esx_inventoryhud:reloadPlayerInventory")
AddEventHandler(
    "esx_inventoryhud:reloadPlayerInventory",
    function()
        if isInInventory then
            loadPlayerInventory()
        end
    end
)

--FAST ITEMS
RegisterNUICallback("PutIntoFast", function(data, cb)
    if data.item.slot ~= nil then
        fastSlot[data.item.slot] = nil
    end
        fastSlot[data.slot] = {name = data.item.name, type = data.item.type, batch = data.item.batch}
        TriggerServerEvent("esx_inventoryhud:changeFastItem", fastSlot)
        loadPlayerInventory()
        cb("ok")
end)

RegisterNUICallback("TakeFromFast", function(data, cb)
    fastSlot[data.item.slot] = nil
    TriggerServerEvent("esx_inventoryhud:changeFastItem", fastSlot)
    loadPlayerInventory()
    cb("ok")
end)

Citizen.CreateThread(function()
        while true do
            Citizen.Wait(0)
            for key, control in pairs(fastControl) do
                if IsDisabledControlJustReleased(1, control) then
                    if fastSlot[key] ~= nil then
                        if fastSlot[key].type == 'item_weapon' then
                            if GetSelectedPedWeapon(GetPlayerPed(-1)) == GetHashKey(fastSlot[key].name) then
                                SetCurrentPedWeapon(GetPlayerPed(-1), "WEAPON_UNARMED",true)
                            else
                                SetCurrentPedWeapon(GetPlayerPed(-1), fastSlot[key].name,true)
                            end
                        else
                            TriggerServerEvent("esx:useItem", fastSlot[key].name, fastSlot[key].batch)
                        end
                    end
                end
            end
        end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then
        closeInventory()
    end
end)