namespace PE.Battle {

  const STAGE_MULT = {
    '-6': 0.2,
    '-5': 0.28,
    '-4': 0.33,
    '-3': 0.4,
    '-2': 0.5,
    '-1': 0.67,
    '0': 1,
    '1': 1.5,
    '2': 2,
    '3': 2.5,
    '4': 3,
    '5': 3.5,
    '6': 4,
  }

  export class Battler {
    private _name: string;
    private _hp = 0;
    private _totalHP = 0;
    private _attack: number;
    private _defense: number;
    private _spatk: number;
    private _spdef: number;
    private _speed: number;
    private _fainted = false;
    private _captured = false;
    totalhp: number;

    ability: string;
    damageState: DamageState;
    effects = {};
    forme: any;
    gender: any;
    item: string;
    ivs: {
      hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
    };
    lastAttacker: {};
    lastHPLost: number;
    lastMoveUsed: number;
    lastMoveUsedSketch: number;
    lastMoveUsedType: number;
    lastRoundMoved: number;
    level: number;
    movesUsed: {};
    moveset: any[];
    sides: { own: ActiveSide, foe: ActiveSide } = { own: undefined, foe: undefined };
    /** Participants will earn Exp. Points if this battler is defeated */
    participants: number[];
    species: string;
    _status: Statuses;
    statusCount: number;
    stages = {};
    tookDamage: boolean;
    turncount: number;
    types: string[];

    // partner: Battler;

    constructor(public pokemon: Pokemon.Pokemon, public index: number) {
      this._hp = 0;
      this._totalHP = 0;
      this._fainted = true;
      this._captured = false;
      this.stages = {};
      this.effects = {};
      this.damageState = new DamageState();
      this.initPokemon(pokemon);
      this.initEffects(false);
      this.initPermanentEffects();
    }

    initPokemon(pokemon: Pokemon.Pokemon) {
      // if (pokemon.isEgg()) throw Error("An egg can't be an active Pokémon");
      this._name = pokemon.name;
      this.species = pokemon.species;
      this.level = pokemon.level;
      this._hp = pokemon.stats.hp;
      this._totalHP = pokemon.stats.hp;
      this.gender = pokemon.gender;
      this.ability = pokemon.ability;
      this.item = pokemon.item;
      this.types = pokemon.types;
      this.forme = pokemon.forme;
      this._attack = pokemon.stats.atk;
      this._defense = pokemon.stats.def;
      this._spatk = pokemon.stats.spa;
      this._spdef = pokemon.stats.spd;
      this._speed = pokemon.stats.spe;
      this.status = pokemon.status;
      this.statusCount = pokemon.statusCount;

      this.totalhp = pokemon.stats.hp;

      this.participants = [];
      this.moveset = pokemon.moveset;
      this.ivs = pokemon.ivs;
    }

    initEffects(batonpass: boolean) {
      if (!batonpass) {
        // These effects are retained if Baton Pass is used
        this.stages[Stats.Attack] = 0;
        this.stages[Stats.Defense] = 0;
        this.stages[Stats.Speed] = 0;
        this.stages[Stats.SpAtk] = 0;
        this.stages[Stats.SpDef] = 0;
        this.stages[Stats.Evasion] = 0;
        this.stages[Stats.Accuracy] = 0;

        this.lastMoveUsedSketch = -1;
        this.effects[Effects.AquaRing] = false;
        this.effects[Effects.Confusion] = 0;
        this.effects[Effects.Curse] = false;
        this.effects[Effects.Embargo] = 0;
        this.effects[Effects.FocusEnergy] = 0;
        this.effects[Effects.GastroAcid] = false;
        this.effects[Effects.HealBlock] = 0;
        this.effects[Effects.Ingrain] = false;
        this.effects[Effects.LeechSeed] = -1;
        this.effects[Effects.LockOn] = 0;
        this.effects[Effects.LockOnPos] = -1;
        for (const battler of $Battle.actives) {
          if (battler.effects[Effects.LockOnPos] === this.index && battler.effects[Effects.LockOn] > 0) {
            battler.effects[Effects.LockOn] = 0;
            battler.effects[Effects.LockOnPos] = -1;
          }
        }
        this.effects[Effects.MagnetRise] = 0;
        this.effects[Effects.PerishSong] = 0;
        this.effects[Effects.PerishSongUser] = -1;
        this.effects[Effects.PowerTrick] = false;
        this.effects[Effects.Substitute] = 0;
        this.effects[Effects.Telekinesis] = 0;
      } else {
        if (this.effects[Effects.LockOn] > 0) {
          this.effects[Effects.LockOn] = 2;
        } else {
          this.effects[Effects.LockOn] = 0;
        }
        if (this.effects[Effects.PowerTrick]) {
          let aux = this.attack;
          this.attack = this.defense;
          this.defense = this.attack;
        }
      }
      // this.damagestate.reset();
      this._fainted = false;
      this.lastAttacker = {};
      this.lastHPLost = 0;
      this.tookDamage = false;
      this.lastMoveUsed = -1;
      this.lastMoveUsedType = -1;
      this.lastRoundMoved = -1;
      this.movesUsed = {};
      this.turncount = 0;
      this.effects[Effects.Attract] = -1;
      for (const battler of $Battle.actives) {
        if (battler.effects[Effects.Attract] === this.index) {
          battler.effects[Effects.Attract] = -1;
        }
      }
      this.effects[Effects.BatonPass] = false;
      this.effects[Effects.Bide] = 0;
      this.effects[Effects.BideDamage] = 0;
      this.effects[Effects.BideTarget] = -1;
      this.effects[Effects.Charge] = 0;
      /** The move id lock by choice band */
      this.effects[Effects.ChoiceBand] = undefined;
      this.effects[Effects.Counter] = -1;
      this.effects[Effects.CounterTarget] = -1;
      this.effects[Effects.DefenseCurl] = false;
      this.effects[Effects.DestinyBond] = false;
      this.effects[Effects.Disable] = 0;
      this.effects[Effects.DisableMove] = 0;
      this.effects[Effects.Electrify] = false;
      this.effects[Effects.Encore] = 0;
      this.effects[Effects.EncoreMoveId] = 0;
      this.effects[Effects.EncoreMove] = 0;
      this.effects[Effects.Endure] = false;
      this.effects[Effects.FirstPledge] = 0;
      this.effects[Effects.FlashFire] = false;
      this.effects[Effects.Flinch] = false;
      this.effects[Effects.FollowMe] = 0;
      this.effects[Effects.Foresight] = false;
      this.effects[Effects.FuryCutter] = 0;
      this.effects[Effects.Grudge] = false;
      this.effects[Effects.HelpingHand] = false;
      this.effects[Effects.HyperBeam] = 0;
      this.effects[Effects.Illusion] = null;
      /**
       * Add here ilusion ability
       */
      this.effects[Effects.Imprison] = false;
      this.effects[Effects.KingsShield] = false;
      this.effects[Effects.LifeOrb] = false;
      this.effects[Effects.MagicCoat] = false;
      this.effects[Effects.MeanLook] = -1;
      for (const battler of $Battle.actives) {
        if (battler.effects[Effects.MeanLook] === this.index) battler.effects[Effects.MeanLook] = -1;
      }
      this.effects[Effects.MeFirst] = false;
      this.effects[Effects.Metronome] = 0;
      this.effects[Effects.MicleBerry] = false;
      this.effects[Effects.Minimize] = false;
      this.effects[Effects.MiracleEye] = false;
      this.effects[Effects.MirrorCoat] = -1;
      this.effects[Effects.MirrorCoatTarget] = -1;
      this.effects[Effects.MoveNext] = false;
      this.effects[Effects.MudSport] = false;
      this.effects[Effects.MultiTurn] = 0;
      this.effects[Effects.MultiTurnAttack] = 0;
      this.effects[Effects.MultiTurnUser] = -1;
      for (const battler of $Battle.actives) {
        if (battler.effects[Effects.MultiTurnUser] === this.index) {
          battler.effects[Effects.MultiTurn] = 0;
          battler.effects[Effects.MultiTurnUser] = -1;
        }
      }
      this.effects[Effects.Nightmare] = false;
      this.effects[Effects.Outrage] = 0;
      this.effects[Effects.ParentalBond] = 0;
      this.effects[Effects.PickupItem] = 0;
      this.effects[Effects.PickupUse] = 0;
      this.effects[Effects.Pinch] = false;
      this.effects[Effects.Powder] = false;
      this.effects[Effects.Protect] = false;
      this.effects[Effects.ProtectNegation] = false;
      this.effects[Effects.ProtectRate] = 1;
      this.effects[Effects.Pursuit] = false;
      this.effects[Effects.Quash] = false;
      this.effects[Effects.Rage] = false;
      this.effects[Effects.Revenge] = 0;
      this.effects[Effects.Roar] = false;
      this.effects[Effects.Rollout] = 0;
      this.effects[Effects.Roost] = false;
      this.effects[Effects.SkipTurn] = false;
      this.effects[Effects.SkyDrop] = false;
      this.effects[Effects.SmackDown] = false;
      this.effects[Effects.Snatch] = false;
      this.effects[Effects.SpikyShield] = false;
      this.effects[Effects.Stockpile] = 0;
      this.effects[Effects.StockpileDef] = 0;
      this.effects[Effects.StockpileSpDef] = 0;
      this.effects[Effects.Taunt] = 0;
      this.effects[Effects.Torment] = false;
      this.effects[Effects.Toxic] = 0;
      this.effects[Effects.Transform] = false;
      this.effects[Effects.Truant] = false;
      this.effects[Effects.TwoTurnAttack] = 0;
      this.effects[Effects.Type3] = undefined;
      this.effects[Effects.Unburden] = false;
      this.effects[Effects.Uproar] = 0;
      this.effects[Effects.Uturn] = false;
      this.effects[Effects.WaterSport] = false;
      this.effects[Effects.WeightChange] = 0;
      this.effects[Effects.Yawn] = 0;
    }

    /**  These effects are always retained even if a Pokémon is replaced */
    initPermanentEffects() {
      this.effects[Effects.FutureSight] = 0;
      this.effects[Effects.FutureSightMove] = 0;
      this.effects[Effects.FutureSightUser] = -1;
      this.effects[Effects.FutureSightUserPos] = -1;
      this.effects[Effects.HealingWish] = false;
      this.effects[Effects.LunarDance] = false;
      this.effects[Effects.Wish] = 0;
      this.effects[Effects.WishAmount] = 0;
      this.effects[Effects.WishMaker] = -1;
    }

    initialize(pokemon: Pokemon.Pokemon, index: number, batonpass: boolean) {
      //Cure status of previous Pokemon with Natural Cure
      if (this.hasAbility('NATURALCURE')) this.status = Statuses.Healthy;
      // if (this.hasAbility('REGENERATOR')) this.recoverHP(Math.floor(this.totalhp / 3));
      this.initPokemon(pokemon);
      this.initEffects(batonpass);
    }

    /** Update Pokémon who will gain EXP if this battler is defeated */
    updateParticipants() {
      if (this.isFainted()) return;
      if ($Battle.isOpposing(this.index)) {
        // Just the player Pokémon will gain epx
        for (const index of this.sides.foe.actives) {
          if (!(index in this.participants) && !$Battle.battlers[index].isFainted()) {
            this.participants.push(index);
          }
        }

      }
    }

    //==================================================================================================================
    //#region Battle Stats and complex accesors
    get hp() {
      return this._hp;
    }

    get attack() {
      return this._attack;
    }

    set attack(value) {
      this._attack = value;
    }

    get defense() {
      return this._defense;
    }

    set defense(value) {
      this._defense = value;
    }

    get spatk() {
      return this._spatk;
    }

    get spdef() {
      return this._spdef;
    }

    get speed() {
      let speed = this._speed;
      speed = Math.floor(speed * STAGE_MULT[this.stages[Stats.Speed]]);
      let speedmod = 1;
      if (($Battle.weather === Weathers.RainDance || $Battle.weather === Weathers.HeavyRain) && this.hasAbility('SWIFTSWIM')) {
        speedmod *= 2;
      }
      if (($Battle.weather === Weathers.SunnyDay || $Battle.weather === Weathers.HarshSun) && this.hasAbility('CHLOROPHYLL')) {
        speedmod *= 2;
      }
      if ($Battle.weather === Weathers.SandStorm && this.hasAbility('SANDRUSH')) {
        speedmod *= 2;
      }
      if (this.hasAbility('QUICKFEET') && this.status !== Statuses.Healthy) {
        speedmod = Math.round(speed * 1.5);
      }
      if (this.hasAbility('UNBURDEN') && this.effects[Effects.Unburden] && this.item == "") {
        speedmod *= 2;
      }
      if (this.hasAbility('SLOWSTART') && this.turncount <= 5) {
        speedmod = Math.round(speedmod / 2);
      }
      if (this.hasItemIn(['MACHOBRACE', 'POWERWEIGHT', 'POWERBRACER', 'POWERBELT', 'POWERANKLET', 'POWERLENS', 'POWERBAND', 'IRONBALL'])) {
        speedmod = Math.round(speedmod / 2);
      }
      if (this.hasItem('CHOICESCARF')) {
        speedmod = Math.round(speed * 1.5);
      }
      if (this.hasItem('QUICKPOWDER') && this.species === 'DITTO' && !this.effects[Effects.Transform]) {
        speedmod *= 2;
      }
      if (this.sides.own.effects[Effects.Tailwind] > 0) {
        speedmod *= 2;
      }
      if (this.sides.own.effects[Effects.Swamp]) {
        speedmod = Math.round(speedmod / 2);
      }
      if (this.status === Statuses.Paralysis && !this.hasAbility('QUICKFEET')) {
        speedmod = Math.round(speedmod / 4);
      }
      speed = Math.round(speed * speedmod);
      return Math.max(1, speed);
    }

    damage(amt) {
      this._hp -= amt;
      if (this._hp <= 0) {
        this._hp = 0;
        this.faint();
      }
    }

    faint(showMessage = true) {
      if (!this.isFainted()) {
        console.log("!!!***Can't faint with HP greater than 0");
        return true;
      }
      if (this._fainted) {
        console.log("!!!***Can't faint if already fainted");
        return true
      }
      // this.battle.scene.fainted(this);
      this.initEffects(false);

      this.status = 0;
      this.statusCount = 0
      // if (this.pokemon && this.battle.internalbattle) {
      //   this.pokemon.changeHappiness("faint");
      // }
      // if (this.pokemon.isMega()) this.pokemon.makeUnmega();
      // if (this.pokemon.isPrimal()) this.pokemon.makeUnprimal();
      this._fainted = true;

      $Battle.choices[this.index] = undefined;
      this.sides.own.effects[Effects.LastRoundFainted] = $Battle.turncount;
      if (showMessage) $Battle.showPausedMessage(`${this.name} fainted!`);
      console.log(`[Pokémon fainted] ${this.name} fainted`);
      return true;
    }

    get status() {
      return this._status;
    }

    set status(value: Statuses) {
      if (this._status === Statuses.Sleep && value === Statuses.Healthy) {
        this.effects[Effects.Truant] = false;
      }
      this._status = value;
      if (this.pokemon) this.pokemon.status = value; // Why?
      if (value !== Statuses.Poison) this.effects[Effects.Toxic] = 0;
      if (value !== Statuses.Poison && value !== Statuses.Sleep) {
        this.statusCount = 0;
        this.pokemon.statusCount = 0;
      }
    }

    weight(attacker: Battler = undefined) {
      let w = this.pokemon.weightkg || 500;
      if (!attacker || !attacker.hasMoldBreaker()) {
        if (this.hasAbility('HEAVYMETAL')) w *= 2;
        if (this.hasAbility('LIGHTMETAL')) w /= 2;
      }
      if (this.hasItem('FLOATSTONE')) w /= 2;
      w *= this.effects[Effects.WeightChange];
      w = Math.floor(w);
      if (w < 0) w = 1;
      return w;
    }


    //#endregion
    //==================================================================================================================

    //==================================================================================================================
    //#region Battler info

    get name() {
      if ($Battle.isOpposing(this.index)) {
        if ($Battle.opponent()) return i18n._("the opposing %1", this._name);
        return i18n._("the wild %1", this._name);
      } else {
        if ($Battle.ownedByPlayer(this.index)) return this._name;
        return i18n._("the ally %1", this._name);
      }
    }

    hasAbility(ability: string, ignorefainted?: boolean) {
      if (this._fainted && !ignorefainted) return false;
      if (this.effects[Effects.GastroAcid]) return false;
      return this.ability === ability;
    }

    hasAbilityIn(abilities: string[]) {
      for (const ability of abilities) {
        if (this.hasAbility(ability)) return true;
      }
      return false;
    }

    hasItem(item: string, ignorefainted?: boolean) {
      if (this._fainted && !ignorefainted) return false;
      if (this.effects[Effects.Embargo]) return false;
      if ($Battle.field.effects[Effects.MagicRoom] > 0) return false;
      if (this.hasAbility('KLUTZ', ignorefainted)) return false;
      return this.item === item;
    }

    hasItemIn(items: string[]) {
      for (const item of items) {
        if (this.hasItem(item)) return true;
      }
      return false;
    }

    hasMove(id: string) {
      if (!id || id === "") return false;
      for (const move of this.moveset) {
        if (id === move) return true;
      }
      return false;
    }

    hasMoveType(type: Types) {
      for (const move of this.moveset) {
        if (move.type === type) return true;
      }
      return false;
    }

    hasMovedThisRound() {
      if (!this.lastRoundMoved) return false;
      return this.lastRoundMoved === $Battle.turncount
    }

    hasMoldBreaker() {
      return this.hasAbilityIn(['MOLDBREAKER', 'TERAVOLT', 'TURBOBLAZE']);
    }

    hasType(type: string) {
      for (const t of this.types) {
        if (t === type) return true;
      }
      if (this.effects[Effects.Type3] && this.effects[Effects.Type3] === type) return true;
      return false;
    }

    isFainted() {
      return this.hp <= 0;
    }

    isOpposing(index) {
      for (const foeindex of this.sides.foe.battlers) {
        if (foeindex === index) return true;
      }
      return false;
    }

    /** Check if the Pokémon touch the field. */
    isAirborne(ignoreability: boolean) {
      if (this.hasItem('IRONBAll')) return false;
      if (this.effects[Effects.Ingrain] || this.effects[Effects.SmackDown]) return false;
      if ($Battle.field.effects[Effects.Gravity]) return false;
      if (this.hasType('FLYING') && !this.effects[Effects.Roost]) return true;
      if (this.hasAbility('levitate') && !ignoreability) return true;
      if (this.hasItem('AIRBALLOON')) return true;
      if (this.effects[Effects.MagnetRise] || this.effects[Effects.Telekinesis]) return true;
      return false;
    }
    //#endregion
    //==================================================================================================================


    //==================================================================================================================
    //#region Status Conditions

    //------------------------------------------------------------------------------------------------------------------
    //#region Sleep
    canSleep(attacker: Battler, showMessages: boolean, move, ignorestatus: boolean) {
      if (this.isFainted()) return false;
      let selfSleep = attacker && attacker.index === this.index;
      if (!ignorestatus && this.status === Statuses.Sleep) {
        if (showMessages) $Battle.showMessage(i18n._(`%1 is already asleep!`, this.name));
        return false;
      }
      // user has sustitute or Safeguard
      if (!selfSleep) {
        if (this.status != Statuses.Healthy ||
          (this.effects[Effects.Substitute] > 0 && (!move || !move.ignoresSubstitute(attacker)))) {
          if (showMessages) $Battle.showMessage(i18n._("But it failed!"));
          return false;
        }

        if (this.sides.own.effects[Effects.Safeguard] > 0 && (!attacker || !attacker.hasAbility('INFILTRATOR'))) {
          if (showMessages) $Battle.showMessage(i18n._("%1's team is protected by Safeguard!", this.name))
          return false;
        }
      }
      // there are field terrains and user touch the field.
      if (!this.isAirborne(attacker && attacker.hasMoldBreaker())) {
        if ($Battle.field.effects[Effects.ElectricTerrain] > 0) {
          if (showMessages)
            $Battle.showMessage(i18n._(`The Electric Terrain prevented %1 from falling asleep!`, this.name));
          return false
        } else if ($Battle.field.effects[Effects.MistyTerrain] > 0) {
          if (showMessages)
            $Battle.showMessage(i18n._(`The Misty Terrain prevented %1 from falling asleep!`, this.name));
          return false
        }
      }
      // uproar
      if ((attacker && attacker.hasMoldBreaker()) || !this.hasAbility('SOUNDPROOF')) {
        for (const battler of $Battle.actives) {
          if (battler.effects[Effects.Uproar] > 0) {
            if (showMessages) $Battle.showMessage(i18n._(`But the uproar kept %1 awake!`, this.name));
            return false
          }
        }
      }

      if (!attacker || selfSleep || !attacker.hasMoldBreaker()) {
        if (this.hasAbilityIn(['VITALSPIRIT', 'INSOMIA', 'SWEETVEIL']) ||
          (this.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) ||
          [Weathers.SunnyDay, Weathers.HarshSun].contains($Battle.weather)) {
          let msg = `%1 stayed awake using its %2!`;
          if (showMessages) $Battle.showMessage(i18n._(msg, this.name, Abilities.name(this.ability)));
          return false;
        }
        // if this.partner.hasAbility('SWEETVEIL') ||
        //    (this.partner.hasAbility('FLOWERVEIL') && this.hasType('GRASS'))
        //   abilityname=Abilities.name(this.partner.ability)
        //   $Battle.showMessage(i18n._("%1 stayed awake using its partner's %2!",this.name,abilityname)) if showMessages
        //   return false
        // end
      }
      return true;
    }

    canSleepYawn() {
      if (this.status !== Statuses.Healthy) return false;
      if (!this.hasAbility('SOUNDPROOF')) {
        for (const battler of $Battle.actives) {
          if (battler.effects[Effects.Uproar] > 0) return false;
        }
      }
      if (!this.isAirborne(undefined)) {
        if ($Battle.field.effects[Effects.ElectricTerrain] > 0
          || $Battle.field.effects[Effects.MistyTerrain] > 0) return false;
      }
      if (this.hasAbilityIn(['VITALSPIRIT', 'INSOMNIA', 'SWEETVEIL']) ||
        (this.hasAbility('LEAFGUARD') && ($Battle.weather == Weathers.SunnyDay ||
          $Battle.weather == Weathers.HarshSun)))
        return false;
      // return false if this.partner.this.hasAbility(:SWEETVEIL)
      return true;
    }

    sleep(msg?: string) {
      this.status = Statuses.Sleep;
      this.statusCount = 2 + Math.randomInt(3);
      if (this.hasAbility('EARLYBIRD')) this.statusCount = Math.floor(this.statusCount / 2);
      // pbCancelMoves()
      // $Battle.pbCommonAnimation("Sleep",self,nil)
      if (msg && msg !== "") $Battle.showMessage(msg);
      else $Battle.showMessage(i18n._("%1 fell asleep!", this.name));
      console.log("[Status change] #{this.name} fell asleep (#{this.statusCount} turns)");
    }

    sleepSelf(duration: number = -1) {
      this.status = Statuses.Sleep;
      if (duration > 0) this.statusCount = duration;
      else this.statusCount = 2 + Math.randomInt(3);
      if (this.hasAbility('EARLYBIRD')) this.statusCount = Math.floor(this.statusCount / 2);
      // pbCancelMoves
      // $Battle.pbCommonAnimation("Sleep",self,nil)
      console.log("[Status change] #{this.name} made itself fall asleep (#{this.statusCount} turns)")
    }
    //#endregion
    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------
    //#region attrack
    canAttract(attacker, showMessages) {
      if (this.isFainted()) return false;
      if (!attacker || attacker.isFainted()) return false;
      if (this.effects[Effects.Attract] >= 0) {
        if (showMessages) $Battle.showMessage(i18n._("But it failed!"));
        return false;
      }
      if (attacker.gender === 'N' || this.gender === 'N' || attacker.gender === this.gender) {
        if (showMessages) $Battle.showMessage(i18n._("But it failed!"));
        return false;
      }
      if ((!attacker || !attacker.hasMoldBreaker()) && this.hasAbility('OBLIVIOUS')) {
        if (showMessages)
          $Battle.showMessage(i18n._("%1's %2 prevents romance!", this.name, Abilities.name(this.ability)));
        return false;
      }
      return true;
    }

    attract(attacker: Battler, showMessage: boolean) {
      this.effects[Effects.Attract] = attacker.index;
      // $Battle.pbCommonAnimation("Attract", this, null);
      if (showMessage) $Battle.showMessage(i18n._(`%1 fell in love!`, this.name));
      console.log(`[Lingering effect triggered] ${this.name} became infatuated (with ${attacker.name})`);
      if (this.hasItem('DESTINYKNOT') && attacker.canAttract(this, false)) {
        attacker.attract(this, false);
        let msg = `%1's %2 made %3 fall in love!`;
        $Battle.showMessage(i18n._(msg, this.name, Items.name(this.item), attacker.name));
        console.log(`[Item triggered] ${this.name}'s Destiny Knot`);
      }
    }
    //#endregion
    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------
    //#region Poison
    canPoison(attacker: Battler, showMessages: boolean, move?: any) {
      if (this._fainted) return false;
      if (this.status === Statuses.Poison) {
        if (showMessages) $Battle.showMessage(i18n._("%1 is already poisoned.", this.name));
        return false
      }
      if (this.status !== Statuses.Healthy ||
        (this.effects[Effects.Substitute] > 0 && (!move || !move.ignoresSubstitute(attacker)))) {
        if (showMessages) $Battle.showMessage(i18n._("But it failed!"));
        return false
      }
      if ((this.hasType('POISON') || this.hasType('STEEL')) && !this.hasItem('RINGTARGET')) {
        if (showMessages) $Battle.showMessage(i18n._("It doesn't affect %1...", this.name));
        return false;
      }
      if ($Battle.field.effects[Effects.MistyTerrain] > 0
        && !this.isAirborne(attacker && attacker.hasMoldBreaker())) {
        let m = "The Misty Terrain prevented %1 from being poisoned!";
        if (showMessages) $Battle.showMessage(i18n._(m, this.name));
        return false;
      }
      if (!attacker || !attacker.hasMoldBreaker()) {
        if (this.hasAbility('IMMUNITY') || (this.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) ||
          (this.hasAbility('LEAFGUARD') && ($Battle.weather === Weathers.SunnyDay ||
            $Battle.weather === Weathers.HarshSun))) {
          let m = "%1's %2 prevents poisoning!";
          if (showMessages) $Battle.showMessage(i18n._(m, this.name, Abilities.name(this.ability)));
          return false;
        }

        if (this.partner.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) {
          let m = "%1's partner's %2 prevents poisoning!";
          if (showMessages) $Battle.showMessage(i18n._(m, this.name, Abilities.name(this.partner.ability)))
          return false;
        }
      }
      if (this.sides.own.effects[Effects.Safeguard] > 0 &&
        (!attacker || !attacker.hasAbility('INFILTRATOR'))) {
        if (showMessages) $Battle.showMessage(i18n._("%1's team is protected by Safeguard!", this.name));
        return false

      }
      return true;
    }

    canPoisonSynchronize(opponent: Battler) {
      if (this._fainted) return false;
      if ((this.hasType('POISON') || this.hasType('STEEL')) && !this.hasItem('RINGTARGET')) {
        $Battle.showMessage(i18n._("%1's %2 had no effect on %3!",
          opponent.name, Abilities.name(opponent.ability), this.name));
        return false
      }
      if (this.status !== Statuses.Healthy) return false;
      if (this.hasAbility('IMMUNITY') || (this.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) ||
        (this.hasAbility('LEAFGUARD') && ($Battle.weather === Weathers.SunnyDay ||
          $Battle.weather === Weathers.HarshSun))) {
        $Battle.showMessage(i18n._("%1's %2 prevents %3's %4 from working!",
          this.name, Abilities.name(this.ability),
          opponent.name, Abilities.name(opponent.ability)))
        return false
      }
      if (this.partner.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) {
        $Battle.showMessage(i18n._("%1's %2 prevents %3's %4 from working!",
          this.partner.name, Abilities.name(this.partner.ability),
          opponent.name, Abilities.name(opponent.ability)));
        return false;
      }
      return true;

    }

    canPoisonSpikes(moldbreaker?: boolean) {
      if (this._fainted) return false;
      if (this.status !== Statuses.Healthy) return false;
      if (this.hasType('POISON') || this.hasType('STEEL')) return false;
      if (!moldbreaker) {
        if (this.hasAbility('IMMUNITY') || (this.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) ||
          (this.partner.hasAbility('FLOWERVEIL') && this.hasType('GRASS'))) return false;
        if (this.hasAbility('LEAFGUARD') && ($Battle.weather === Weathers.SunnyDay ||
          $Battle.weather == Weathers.HarshSun)) return false;
      }
      if (this.sides.own.effects[Effects.Safeguard] > 0) return false
      return true;
    }

    poison(attacker: Battler = undefined, msg: string = undefined, toxic: boolean = false) {
      this.status = Statuses.Poison;
      this.statusCount = toxic ? 1 : 0;
      this.effects[Effects.Toxic] = 0;
      // $Battle.pbCommonAnimation("Poison",self,nil)
      if (msg && msg !== "") $Battle.showMessage(msg);
      else {
        if (toxic) $Battle.showMessage(i18n._("%1 was badly poisoned!", this.name));
        else $Battle.showMessage(i18n._("%1 was poisoned!", this.name));
      }
      if (toxic) console.log("[Status change] #{this.name} was badly poisoned]");
      else console.log("[Status change] #{this.name} was poisoned");
      if (attacker && this.index !== attacker.index && this.hasAbility('SYNCHRONIZE')) {
        if (attacker.canPoisonSynchronize(this)) {
          console.log("[Ability triggered] #{this.this.name}'s Synchronize");
          let m = i18n._("%1's %2 poisoned %3!", this.name, Abilities.name(this.ability), attacker.name);
          attacker.poison(undefined, m, toxic);
        }
      }
    }
    //#endregion
    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------
    //#region Paralize
    canParalize() { }
    paralize() { }
    //#endregion
    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------
    //#region Burn
    /**
     * Check if the Pokémon can be burned.
     * @param attacker The Attacter Pokémon if exist
     * @param showMessages Show or not the info messages
     * @param move the move used
     */
    conBurn(attacker: Battler, showMessages: boolean, move: any = undefined) {
      if (this._fainted) return false;
      if (this.status === Statuses.Burn) {
        if (showMessages) $Battle.showMessage(i18n._("%1 already has a burn.", this.name));
        return false;
      }
      if (this.status !== Statuses.Healthy ||
        (this.effects[Effects.Substitute] > 0 && (!move || !move.ignoresSubstitute(attacker)))) {
        if (showMessages) $Battle.showMessage(i18n._("But it failed!"));
        return false;
      }
      if ($Battle.field.effects[Effects.MistyTerrain] > 0 && !this.isAirborne(attacker && attacker.hasMoldBreaker())) {
        if (showMessages) {
          let msg = i18n._("The Misty Terrain prevented %1 from being burned!", this.name);
          $Battle.showMessage(msg);
        }
        return false;
      }
      if (this.hasType('FIRE') && !this.hasItem('RINGTARGET')) {
        if (showMessages) $Battle.showMessage(i18n._("It doesn't affect %1...", this.name));
        return false;
      }
      if (!attacker || !attacker.hasMoldBreaker()) {
        if (this.hasAbility('WATERVEIL') || (this.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) ||
          (this.hasAbility('LEAFGUARD') && ($Battle.weather === Weathers.SunnyDay || $Battle.weather === Weathers.HarshSun))) {
          if (showMessages) {
            let msg = i18n._("%1's %2 prevents burns!", this.name, Abilities.name(this.ability));
            $Battle.showMessage(msg);
          }
          return false;
        }
        if (this.partner.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) {
          if (showMessages) {
            let msg = i18n._("%1's partner's %2 prevents burns!", this.name, Abilities.name(this.partner.ability));
            $Battle.showMessage(msg);
          }
          return false;
        }
      }
      if (this.sides.own.effects[Effects.Safeguard] > 0 && (!attacker || !attacker.hasAbility('INFILTRATOR'))) {
        if (showMessages) $Battle.showMessage(i18n._("%1's team is protected by Safeguard!", this.name));
        return false;
      }
      return true;
    }

    /**
     * Check if the Pokémon can be **burned** by **Synchronize** ability
     * @param opponent The ability Pokémon user
     */
    canBurnSynchronize(opponent: Battler) {
      if (this._fainted) return false;
      if (this.status !== Statuses.Healthy) return false;
      if (this.hasType('FIRE') && !this.hasItem('RINGTARGET')) {
        let msg = i18n._("%1's %2 had no effect on %3!", opponent.name, Abilities.name(opponent.ability), this.name);
        $Battle.showMessage(msg);
        return false;
      }
      let text = "%1's %2 prevents %3's %4 from working!";
      let msg = i18n._(text, this.name, Abilities.name(this.ability), opponent.name, Abilities.name(opponent.ability));
      if (this.hasAbility('WATERVEIL') ||
        (this.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) ||
        (this.hasAbility('LEAFGUARD') && ($Battle.weather === Weathers.SunnyDay || $Battle.weather == Weathers.HarshSun))) {
        $Battle.showMessage(msg);
        return false;
      }
      if (this.partner.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) {
        $Battle.showMessage(msg);
        return false;
      }
      return true;
    }


    /**
     * Burn the Pokémon, sets the Pokémon ststaus to burn.
     * @param attacker the attacker Pokémon if exist
     * @param msg custom info message
     */
    burn(attacker: Battler = undefined, msg: string = undefined) {
      this.status = Statuses.Burn;
      this.statusCount = 0;
      // @battle.pbCommonAnimation("Burn",self,nil)
      if (msg && msg != "") $Battle.showMessage(msg);
      else $Battle.showMessage(i18n._("%1 was burned!", this.name))
      console.log("[Status change] #{this.name} was burned");
      if (attacker && this.index !== attacker.index && this.hasAbility('SYNCHRONIZE')) {
        if (attacker.canBurnSynchronize(this)) {
          console.log("[Ability triggered] #{this.this.name}'s Synchronize")
          let m = i18n._("%1's %2 burned %3!", this.name, Abilities.name(this.ability), attacker.name);
          attacker.burn(undefined, m);
        }
      }
    }
    //#endregion
    //------------------------------------------------------------------------------------------------------------------

    //#endregion
    //==================================================================================================================

    //==================================================================================================================
    //#region Increase stat stages
    tooHigh(stat: Stats) {
      return this.stages[stat] >= 6;
    }

    canIncreaseStatStage(stat: Stats, attacker: Battler = undefined, showMessages = false, move = undefined,
      moldbreaker = false, ignoreContrary = false) {
      if (this._fainted) return false;
      if (!moldbreaker) {
        if (!attacker || attacker.index === this.index || !attacker.hasMoldBreaker()) {
          if (this.hasAbility('CONTRARY') && !ignoreContrary) {
            return this.canReduceStatStage(stat, attacker, showMessages, moldbreaker, true)
          }
        }
      }
      if (this.tooHigh(stat)) {
        if (showMessages) $Battle.showMessage(i18n._("%1's %2 won't go any higher!", this.name, Stats.name(stat)));
        return false;
      }
      return true;
    }

    increaseStatBasic(stat: Stats, increment: number, attacker: Battler = undefined,
      moldbreaker = false, ignoreContrary = false) {
      if (!moldbreaker) {
        if (!attacker || attacker.index == this.index || !attacker.hasMoldBreaker()) {
          if (this.hasAbility('CONTRARY') && !ignoreContrary) {
            return this.reduceStatBasic(stat, increment, attacker, moldbreaker, true)
          }
          if (this.hasAbility('SIMPLE')) increment *= 2;
        }
      }
      increment = Math.min(increment, 6 - this.stages[stat]); // Why?
      console.log(`[Stat change] ${this.name}'s ${Stats.name(stat)} rose by ${increment} stage(s)`);
      console.log(`${Stats.name(stat)} stage: ${this.stages[stat]} --> ${this.stages[stat] + increment}`);
      this.stages[stat] += increment;
      return increment;
    }

    increaseStat(stat: Stats, increment: number, attacker: Battler, showMessages: boolean,
      move: any = undefined, animation: boolean = true, moldbreaker: boolean = false, ignoreContrary: boolean = false) {
      if (!(stat in Stats)) return false;
      if (!moldbreaker) {
        if (!attacker || attacker.index === this.index || !attacker.hasMoldBreaker()) {
          if (this.hasAbility('CONTRARY') && !ignoreContrary) {
            return this.reduceStat(stat, increment, attacker, showMessages, move, animation, moldbreaker, true);
          }
        }
      }
      if (this.canIncreaseStatStage(stat, attacker, showMessages, move, moldbreaker, ignoreContrary)) {
        increment = this.increaseStatBasic(stat, increment, attacker, moldbreaker, ignoreContrary);
        if (increment > 0) {
          if (ignoreContrary) {
            if (animation) $Battle.showMessage(i18n._("%1's %2 activated!", this.name, Abilities.name(this.ability)));
          }
          // if (animation) $Battle.pbCommonAnimation("StatUp",self,nil);
          let texts = [
            i18n._("%1's %2 rose!", this.name, Stats.name(stat)),
            i18n._("%1's %2 rose sharply!", this.name, Stats.name(stat)),
            i18n._("%1's %2 rose drastically!", this.name, Stats.name(stat))]
          if (showMessages) $Battle.showMessage(texts[Math.min(increment - 1, 2)]);
          return true
        }
      }
      return false;
    }

    increaseStatWithCause(stat: Stats, increment: number, attacker: Battler, cause: string, showanim = true,
      showMessages = true, moldbreaker = false, ignoreContrary = false) {
      if (!(stat in Stats)) return false;
      if (!moldbreaker) {
        if (!attacker || attacker.index == this.index || !attacker.hasMoldBreaker()) {
          if (this.hasAbility('CONTRARY') && !ignoreContrary) {
            return this.reduceStatWithCause(stat, increment, attacker, cause, showanim, showMessages, moldbreaker, true);
          }
        }
      }
      if (this.canIncreaseStatStage(stat, attacker, false, undefined, moldbreaker, ignoreContrary)) {
        increment = this.increaseStatBasic(stat, increment, attacker, moldbreaker, ignoreContrary);
        if (increment > 0) {

          if (ignoreContrary) {
            if (showMessages) $Battle.showMessage(i18n._("%1's %2 activated!", this.name, Abilities.name(this.ability)))
          }
          // if (showanim) @battle.pbCommonAnimation("StatUp",self,nil)
          let texts = [];
          if (attacker.index === this.index) {
            texts = [
              i18n._("%1's %2 raised its %3!", this.name, cause, Stats.name(stat)),
              i18n._("%1's %2 sharply raised its %3!", this.name, cause, Stats.name(stat)),
              i18n._("%1's %2 went way up!", this.name, Stats.name(stat))
            ]
          }
          else {
            texts = [
              i18n._("%1's %2 raised %3's %4!", attacker.name, cause, this.name, Stats.name(stat)),
              i18n._("%1's %2 sharply raised %3's %4!", attacker.name, cause, this.name, Stats.name(stat)),
              i18n._("%1's %2 drastically raised %3's %4!", attacker.name, cause, this.name, Stats.name(stat))
            ]
          }
          if (showMessages) $Battle.showMessage(texts[Math.min(increment - 1, 2)]);
          return true;
        }
      }
      return false;
    }

    //#endregion
    //==================================================================================================================

    //==================================================================================================================
    //#region Decrease stat stages
    tooLow(stat: Stats) {
      return this.stages[stat] <= -6;
    }

    /**
     * Check if can decrease the stat stage
     *
     * Tickle (04A) and Noble Roar (13A) can't use this, but replicate it instead.
     * (Reason is they lowers more than 1 stat independently, and therefore could
     * show certain messages twice which is undesirable.)
     * @param stat The stat to check
     * @param attacker The Attacker pokémon
     * @param showMessages Show Info messages
     * @param move The move used
     * @param moldbreaker
     * @param ignoreContrary
     */
    canReduceStatStage(stat: Stats, attacker: Battler = undefined, showMessages = false, move: any = undefined,
      moldbreaker = false, ignoreContrary = false) {
      if (this._fainted) return false;
      if (!moldbreaker) {
        if (!attacker || attacker.index === this.index || !attacker.hasMoldBreaker()) {
          if (this.hasAbility('CONTRARY') && !ignoreContrary) {
            return this.canIncreaseStatStage(stat, attacker, showMessages, move, moldbreaker, true)
          }
        }
      }
      let selfreduce = attacker && attacker.index === this.index;
      if (!selfreduce) {
        if (this.effects[Effects.Substitute] > 0 && (!move || !move.ignoresSubstitute(attacker))) {
          if (showMessages) $Battle.showMessage(i18n._("But it failed!"));
          return false;
        }
        if (this.sides.own.effects[Effects.Mist] > 0 && (!attacker || !attacker.hasAbility('INFILTRATOR'))) {
          if (showMessages) $Battle.showMessage(i18n._("%1 is protected by Mist!", this.name));
          return false;
        }
        if (!moldbreaker && (!attacker || !attacker.hasMoldBreaker())) {
          if (this.hasAbilityIn(['CLEARBODY', 'WHITESMOKE'])) {
            if (showMessages) {
              let msg = "%1's %2 prevents stat loss!";
              $Battle.showMessage(i18n._(msg, this.name, Abilities.name(this.ability)));
            }
            return false;
          }
          if (this.hasType('GRASS')) {
            if (this.hasAbility('FLOWERVEIL')) {
              if (showMessages) {
                let msg = "%1's %2 prevents stat loss!";
                $Battle.showMessage(i18n._(msg, this.name, Abilities.name(this.ability)));
              }
              return false;
            }
            else if (this.partner.hasAbility('FLOWERVEIL')) {
              if (showMessages) {
                let msg = "%1's %2 prevents %3's stat loss!";
                $Battle.showMessage(i18n._(msg, this.partner.name, Abilities.name(this.ability), this.name));
              }
              return false;
            }
          }
          if (stat === Stats.Attack && this.hasAbility('HYPERCUTTER')) {
            if (showMessages) {
              let msg = "%1's %2 prevents Attack loss!";
              $Battle.showMessage(i18n._(msg, this.name, Abilities.name(this.ability)));
            }
            return false;
          }
          if (stat === Stats.Defense && this.hasAbility('BIGPECKS')) {
            if (showMessages) {
              let msg = "%1's %2 prevents Defence loss!";
              $Battle.showMessage(i18n._(msg, this.name, Abilities.name(this.ability)));
            }
            return false;
          }
          if (stat === Stats.Accuracy && this.hasAbility('KEENEYE')) {
            if (showMessages) {
              let msg = "%1's %2 prevents Accuracy loss!";
              $Battle.showMessage(i18n._(msg, this.name, Abilities.name(this.ability)));
            }
            return false;
          }
        }
      }
      if (this.tooLow(stat)) {
        if (showMessages) $Battle.showMessage(i18n._("%1's %2 won't go any lower!", this.name, Stats.name(stat)));
        return false;
      }
      return true;
    }

    reduceStatBasic(stat: Stats, increment: number, attacker: Battler = undefined,
      moldbreaker = false, ignoreContrary = false) {
      // moldbreaker is true only when Roar forces out a Pokémon into Sticky Web
      if (!moldbreaker) {
        if (!attacker || attacker.index == this.index || !attacker.hasMoldBreaker()) {
          if (this.hasAbility('CONTRARY') && !ignoreContrary) {
            return this.increaseStatBasic(stat, increment, attacker, moldbreaker, true);
          }
          if (this.hasAbility('SIMPLE')) increment *= 2;
        }
      }
      increment = Math.min(increment, 6 + this.stages[stat]);
      console.log(`[Stat change] ${this.name}'s ${Stats.name(stat)} fell by ${increment} stage(s)`);
      console.log(`${Stats.name(stat)} stage: ${this.stages[stat]} --> ${this.stages[stat] - increment}`)
      this.stages[stat] -= increment;
      return increment;
    }

    reduceStat(stat: Stats, increment: number, attacker: Battler, showMessages: boolean,
      move: any = undefined, downanim = true, moldbreaker = false, ignoreContrary = false) {
      if (!(stat in Stats)) return false;
      if (!moldbreaker) {

        if (!attacker || attacker.index === this.index || !attacker.hasMoldBreaker()) {
          if (this.hasAbility('CONTRARY') && !ignoreContrary) {
            return this.increaseStat(stat, increment, attacker, showMessages, move, downanim, moldbreaker, true)
          }
        }
      }
      if (this.canReduceStatStage(stat, attacker, showMessages, move, moldbreaker, ignoreContrary)) {
        increment = this.reduceStatBasic(stat, increment, attacker, moldbreaker, ignoreContrary)
        if (increment > 0) {
          if (ignoreContrary) {
            if (downanim) $Battle.showMessage(i18n._("%1's %2 activated!", this.name, Abilities.name(this.ability)));
          }
          // $Battle.pbCommonAnimation("StatDown",self,nil) if downanim
          let texts = [
            i18n._("%1's %2 fell!", this.name, Stats.name(stat)),
            i18n._("%1's %2 harshly fell!", this.name, Stats.name(stat)),
            i18n._("%1's %2 severely fell!", this.name, Stats.name(stat))]
          if (showMessages) $Battle.showMessage(texts[Math.min(increment - 1, 2)])
          // Defiant
          if (this.hasAbility('DEFIANT') && (!attacker || attacker.isOpposing(this.index))) {
            this.increaseStatWithCause(Stats.Attack, 2, this, Abilities.name(this.ability));
          }
          // Competitive
          if (this.hasAbility('COMPETITIVE') && (!attacker || attacker.isOpposing(this.index))) {
            this.increaseStatWithCause(Stats.SpAtk, 2, this, Abilities.name(this.ability))
          }
          return true;
        }
      }
      return false;
    }

    reduceStatWithCause(stat: Stats, increment: number, attacker: Battler, cause: string,
      showanim = true, showMessages = true, moldbreaker = false, ignoreContrary = false) {
      if (!(stat in Stats)) return false;
      if (!moldbreaker) {
        if (!attacker || attacker.index === this.index || !attacker.hasMoldBreaker()) {
          if (this.hasAbility('CONTRARY') && !ignoreContrary) {
            return this.increaseStatWithCause(stat, increment, attacker, cause, showanim, showMessages, moldbreaker, true);
          }
        }
      }
      if (this.canReduceStatStage(stat, attacker, false, undefined, moldbreaker, ignoreContrary)) {
        increment = this.reduceStatBasic(stat, increment, attacker, moldbreaker, ignoreContrary);
        if (increment > 0) {
          if (ignoreContrary) {

            if (showMessages) $Battle.showMessage(i18n._("%1's %2 activated!", this.name, Abilities.name(this.ability)));
          }
          // if (showanim) $Battle.pbCommonAnimation("StatDown",self,nil)
          let texts = [];
          if (attacker.index === this.index) {

            texts = [
              i18n._("%1's %2 lowered its %3!", this.name, cause, Stats.name(stat)),
              i18n._("%1's %2 harshly lowered its %3!", this.name, cause, Stats.name(stat)),
              i18n._("%1's %2 severely lowered its %3!", this.name, cause, Stats.name(stat))
            ]
          }
          else {
            texts = [
              i18n._("%1's %2 lowered %3's %4!", attacker.name, cause, this.name, Stats.name(stat)),
              i18n._("%1's %2 harshly lowered %3's %4!", attacker.name, cause, this.name, Stats.name(stat)),
              i18n._("%1's %2 severely lowered %3's %4!", attacker.name, cause, this.name, Stats.name(stat))
            ]
          }
          if (showMessages) $Battle.showMessage(texts[Math.min(increment - 1, 2)]);
          // Defiant
          if (this.hasAbility('DEFIANT') && (!attacker || attacker.isOpposing(this.index))) {
            this.increaseStatWithCause(Stats.Attack, 2, this, Abilities.name(this.ability));
          }
          // Competitive
          if (this.hasAbility('COMPETITIVE') && (!attacker || attacker.isOpposing(this.index))) {
            this.increaseStatWithCause(Stats.SpAtk, 2, this, Abilities.name(this.ability))
          }
          return true
        }
      }
      return false;
    }

    reduceAttackStatIntimidate(opponent: Battler) {
      if (this._fainted) return false;
      if (this.effects[Effects.Substitute] > 0) {
        let msg = "%1's substitute protected it from %2's %3!";
        $Battle.showMessage(i18n._(msg, this.name, opponent.name, Abilities.name(opponent.ability)))
        return false;
      }
      if (!opponent.hasAbility('CONTRARY')) {
        if (this.sides.own.effects[Effects.Mist] > 0) {
          let msg = "%1 is protected from %2's %3 by Mist!";
          $Battle.showMessage(i18n._(msg, this.name, opponent.name, Abilities.name(opponent.ability)))
          return false;
        }
        if (this.hasAbilityIn(['CLEARBODY', 'WHITESMOKE', 'HYPERCUTTER']) || (this.hasAbility('FLOWERVEIL') && this.hasType('GRASS'))) {
          let msg = "%1's %2 prevented %3's %4 from working!";
          $Battle.showMessage(i18n._(msg, this.name, Abilities.name(this.ability),
            opponent.name, Abilities.name(opponent.ability)))
          return false;
        }
        if (this.partner.hasAbility('FLOWERVEIL') && this.hasType('GRASS')) {
          let msg = "%1's %2 prevented %3's %4 from working!";
          $Battle.showMessage(i18n._(msg, this.partner.name, Abilities.name(this.partner.ability),
            opponent.name, Abilities.name(opponent.ability)))
          return false
        }
      }
      return this.reduceStatWithCause(Stats.Attack, 1, opponent, Abilities.name(opponent.ability))
    }


    //#endregion
    //==================================================================================================================


    get partner() {
      return this;
    }

  }
}