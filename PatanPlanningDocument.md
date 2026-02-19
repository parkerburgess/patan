# Project Overview
This will create a simple version of the board game Catan.  It will be a single player game with 2-4 NPC.

## Data Strucuters
Tile
    Id                  number
    Resouce             string (restricted to ResouceTypes)
    DieNumber           number (only 1-6 allowed)
    HasRobber           bool   (default to false)

VillageLocation 
    Id                  number
    OwnerId             number
    AdjacentVillages    [VillageLocation]
    Bonus               BonusType
    IsVillage           bool
    IsTown              bool

RoadLocation
    Id                  number
    OwnerId             number
    VillageLocation1    VillageLocation
    VillageLocation2    VillageLocation

Player 
    Id                  number
    Color               string
    Icon                string (url to image)
    Villages            [VillageLocation]       -- derived from Board.VillageLocations.Where(vl => vl.OwnerId == Id)
    Roads               [RoadLocation]          -- derived from Board.RoadLocations.Where(rl => rl.OwnerId == Id)
    ResouceCards        [ResouceCard] 
    DevCards            [DevCard]
    ArmyCount           number
    RoadLength          number
    HasLargestArmy      bool
    HasLongestRoad      bool
    Score

Board 
    PointsForVictory    10
    VillageLimit        5
    TownLimit           4
    RoadLimit           15
    Tiles               [Tile]
    Players             [Player]
    VillageLocations    [VillageLocation]
    RoadLocations       [RoadLocation]
    IsInSetup           bool

DevCard 
    DevCardType         string
    IsPlayable          bool

ResouceCard
    ResouceType         string

DevCardTypes 
    ["VictoryPoint" "Knight" "YearOfPlenty" "Monopoly"]

ResouceTypes 
    ["Wood", "Brick", "Sheep", "Wheat", "Stone", "Desert"]

BonusTypes 
    ["Wood", "Brick", "Sheep", "Wheat", "Stone", "Generic", "Generic", "Generic", "Generic"]


    

## Methods
    CreateBoard()
        board = new Board()
        board.IsInSetup = true
        board.Tiles = CreateTiles()
        board.VillageLocationss = CreateVillageLocations()
        board.RoadLocations = CreateRoadlocations

    CreateTiles()
        create an list of 19 Tiles Where
            4 have "Wood" as their Resouce
            4 have "Sheep" as their Resouce
            3 have "Brick" as their Resouce
            3 have "Wheat" as their Resouce
            3 have "Stone" as their Resouce
            1 has "Desert" as its Resouce

            their Ids should range from 1 to 19

        the 1 with Resouce == "Desert" should have HasRobber = true
        randomly assign their DieNumber with values from 2 to 12 with these conditions
            the one where Resouce == "Desert" should get no value
            2 and 12 should only be assigned to 1 tile each
            3 to 11 should be assigned to 2 tiles each
        Leave a //TODO note to not allow 6s and 8s to be next to each other

        return the list of tiles

    CreateVillageLocations()
        create list of 54 VillageLocations


        return the list of villages



    PlaceVillage(village: VillageLocation, player: Player, board: Board)
        if village.OwnerId != null
            return
        if player.Villages.Where(v => v.IsTown).Count() >= board.VillageLimit
            return
        if village.AdjacentVillages.Any(av => av.OwnerId != null)
            return
        if board.IsInSetup
            village.OwnerId = player.Id
            return
        if DoesPlayerHaveVillageCards()
            RemoveResouceCards()
            village.OwnerId = player.Id
            TestForVictory()
    
    PlaceTown(town: VillageLocation, player: Player, board: Board)
        if town.OwnerId != Player.Id
            return
        if board.IsInSetup
            return
        if played.VillageLocations.Where(vl => vl.IsTown).Count() > board.TownLimit 
            return
        if player.VillageLocations.None(vl => vl.Id == town.Id && vl.IsTown == false)
            return
        if DoesPlayerHaveTownCards()
            town.IsTown = true
            RemoveResouceCards()
            TestForVictory()

    PlaceRoad()
        DoesPlayerHaveRoadToPlace()
        IsValidRoadPlacement()
            -is road location empty
            -is it next to an owned VillageLocation
                or connected to an owned road
        IsLongestRoad()
        TestForVictory()
    
    DrawDevCard()
        if VictoryPoint TestForVictory()
        DevCard.IsPlayable = false
        AssignToPlayer
    
    RollDice()
        - roll two 6 sided dice and return results
    
    AssingCardsToAllPlayers()
    
    ProcessRobber()
        -- remove cards from all players with 8+ ResouceCards
        MoveRobber()

    ProcessKnight()
        MoveRobber()
        IncrementArmyCount()
        TestForVictory()

    MoveRobber()
            -- update Tiles[]
            -- take card from player
    PlayerTurn()
        --allow Knight card to be played
        RollDice()
        AssingCardsToAllPlayers()
        WaitForAction:
            InitiateTrade()
            PlaceVillage()
            PlaceTown()
            PlaceRoad()
            EndTurn()

    EndTurn()
        AssignActivePlayer()
        PlayerTurn(Player)


    

            
