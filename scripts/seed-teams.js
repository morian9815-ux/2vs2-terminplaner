'use strict';
/*
 * 2vs2 Liga – Offizielle Daten der 5. Saison ("Die Ära"):
 * - 8 Ligen (1. Diamant bis 6.2 Eisen II)
 * - 44 echte Teams (mit Original-Team-IDs) + 4 Dummy-Teams (Freispiele in 5.1, 5.2, 6.1, 6.2)
 * - 88 Spieler (mit Original-Community-IDs, Discord-Username & Anzeigename)
 * - Alle 240 offiziellen Saison-Paarungen (Hinrunde W1–W5 & Rückrunde W7–W11)
 */

const LEAGUE_TEAMS = [
  {
    "league_id": "liga-1",
    "teams": [
      {
        "id": 17,
        "name": "Ballgefühl",
        "players": [
          {
            "id": 28,
            "name": "Artox",
            "displayName": "Artox",
            "role": "captain"
          },
          {
            "id": 17,
            "name": "Eurosparr",
            "displayName": "Eurosparr",
            "role": "member"
          }
        ]
      },
      {
        "id": 8,
        "name": "Schlagfertig",
        "players": [
          {
            "id": 9,
            "name": "Ernie",
            "displayName": "Ernie",
            "role": "captain"
          },
          {
            "id": 16,
            "name": "Kalli",
            "displayName": "Kalli",
            "role": "member"
          }
        ]
      },
      {
        "id": 5,
        "name": "Die Normalerweisen",
        "players": [
          {
            "id": 6,
            "name": "LuHa101",
            "displayName": "LuHa101",
            "role": "captain"
          },
          {
            "id": 24,
            "name": "Seebaer1605",
            "displayName": "Seebaer1605",
            "role": "member"
          }
        ]
      },
      {
        "id": 2,
        "name": "Mighty Machines",
        "players": [
          {
            "id": 4,
            "name": "BuckRogers | ᴹᶦᵍʰᵗʸ ᴹᵃᶜʰᶦⁿᵉˢ",
            "displayName": "BuckRogers",
            "role": "captain"
          },
          {
            "id": 30,
            "name": "Cyphex | ᴹᶦᵍʰᵗʸ ᴹᵃᶜʰᶦⁿᵉˢ",
            "displayName": "Cyphex",
            "role": "member"
          }
        ]
      },
      {
        "id": 57,
        "name": "Funny Games",
        "players": [
          {
            "id": 46,
            "name": "Biagio",
            "displayName": "BIAGIO",
            "role": "captain"
          },
          {
            "id": 116,
            "name": "Gio’",
            "displayName": "Gio",
            "role": "member"
          }
        ]
      },
      {
        "id": 72,
        "name": "Lauf Forrest Lauf",
        "players": [
          {
            "id": 131,
            "name": "atiyes_LFL",
            "displayName": "atiyes_⛳",
            "role": "captain"
          },
          {
            "id": 58,
            "name": "Andi Wu",
            "displayName": "Andi Wu",
            "role": "member"
          }
        ]
      }
    ]
  },
  {
    "league_id": "liga-2",
    "teams": [
      {
        "id": 1,
        "name": "Black Wings",
        "players": [
          {
            "id": 1,
            "name": "Foxy 🦊",
            "displayName": "FoxyFire",
            "role": "captain"
          },
          {
            "id": 2,
            "name": "morian981",
            "displayName": "Mo",
            "role": "member"
          }
        ]
      },
      {
        "id": 31,
        "name": "The incredible known",
        "players": [
          {
            "id": 56,
            "name": "Ulverine",
            "displayName": "Ulverine",
            "role": "captain"
          },
          {
            "id": 57,
            "name": "Elle221164",
            "displayName": "Elle64",
            "role": "member"
          }
        ]
      },
      {
        "id": 4,
        "name": "Doppelbande",
        "players": [
          {
            "id": 41,
            "name": "Sonzok",
            "displayName": "Sonzok",
            "role": "captain"
          },
          {
            "id": 5,
            "name": "PascaLaVista",
            "displayName": "PascaLaVista",
            "role": "member"
          }
        ]
      },
      {
        "id": 30,
        "name": "MiniGolf Mavericks",
        "players": [
          {
            "id": 55,
            "name": "Handrake 🐲",
            "displayName": "Handrake",
            "role": "captain"
          },
          {
            "id": 62,
            "name": "SteBu",
            "displayName": "SteBu",
            "role": "member"
          }
        ]
      },
      {
        "id": 15,
        "name": "Mallefiz",
        "players": [
          {
            "id": 26,
            "name": "AlexConrad",
            "displayName": "AlexConrad",
            "role": "captain"
          },
          {
            "id": 29,
            "name": "Martin Carboni🏖",
            "displayName": "Martin Carboni🏖",
            "role": "member"
          }
        ]
      },
      {
        "id": 50,
        "name": "Metal Putters",
        "players": [
          {
            "id": 20,
            "name": "TwizyNickyᴹᵉᵗᵃˡᴾᵘᵗᵗᵉʳˢ🤘",
            "displayName": "TwizyNicky",
            "role": "captain"
          },
          {
            "id": 78,
            "name": "RunningNeo",
            "displayName": "RunningNeo",
            "role": "member"
          }
        ]
      }
    ]
  },
  {
    "league_id": "liga-3",
    "teams": [
      {
        "id": 24,
        "name": "404: Loch nicht gefunden",
        "players": [
          {
            "id": 40,
            "name": "Cyber_C_(Christian)",
            "displayName": "Cyber_C",
            "role": "captain"
          },
          {
            "id": 10,
            "name": "Mandek",
            "displayName": "Mandek",
            "role": "member"
          }
        ]
      },
      {
        "id": 25,
        "name": "Weil wir so Sexy sind",
        "players": [
          {
            "id": 42,
            "name": "okny VR",
            "displayName": "okny",
            "role": "captain"
          },
          {
            "id": 43,
            "name": "Pipiii🇦🇹",
            "displayName": "Pipiii",
            "role": "member"
          }
        ]
      },
      {
        "id": 48,
        "name": "Die Lochologen",
        "players": [
          {
            "id": 97,
            "name": "Maginus",
            "displayName": "Maginus",
            "role": "captain"
          },
          {
            "id": 99,
            "name": "Yurn1",
            "displayName": "Yurn",
            "role": "member"
          }
        ]
      },
      {
        "id": 29,
        "name": "Twodevilz",
        "players": [
          {
            "id": 51,
            "name": "Jaxmi79 [2Devilz]",
            "displayName": "Jaxmi79",
            "role": "captain"
          },
          {
            "id": 53,
            "name": "Pat_71 [Blackdevils]",
            "displayName": "Pat_71",
            "role": "member"
          }
        ]
      },
      {
        "id": 18,
        "name": "Duo mit Drive [DmD]",
        "players": [
          {
            "id": 32,
            "name": "GLLG/Felix",
            "displayName": "Felix",
            "role": "captain"
          },
          {
            "id": 307,
            "name": "Leinadz",
            "displayName": "Lein4dz",
            "role": "member"
          }
        ]
      },
      {
        "id": 42,
        "name": "Superputtural",
        "players": [
          {
            "id": 49,
            "name": "Leviathan",
            "displayName": "Leviathan",
            "role": "captain"
          },
          {
            "id": 89,
            "name": "Calliope",
            "displayName": "Calliope",
            "role": "member"
          }
        ]
      }
    ]
  },
  {
    "league_id": "liga-4",
    "teams": [
      {
        "id": 53,
        "name": "Birdie Bros",
        "players": [
          {
            "id": 101,
            "name": "Barkos2009[ᴮⁱʳᵈⁱᵉ ᴮʳᵒˢ]",
            "displayName": "Barkos2009",
            "role": "captain"
          },
          {
            "id": 105,
            "name": "Ewu4866 [ᴮⁱʳᵈⁱᵉ ᴮʳᵒˢ]",
            "displayName": "Ewu4866",
            "role": "member"
          }
        ]
      },
      {
        "id": 62,
        "name": "Knapp vorbei",
        "players": [
          {
            "id": 124,
            "name": "Bolle",
            "displayName": "Bolle",
            "role": "captain"
          },
          {
            "id": 125,
            "name": "scholzi",
            "displayName": "Scholzi",
            "role": "member"
          }
        ]
      },
      {
        "id": 54,
        "name": "Die Ballflüsterer",
        "players": [
          {
            "id": 39,
            "name": "Who_Man_BF",
            "displayName": "Who_Man_BF",
            "role": "captain"
          },
          {
            "id": 109,
            "name": "Alvar",
            "displayName": "Alvar",
            "role": "member"
          }
        ]
      },
      {
        "id": 47,
        "name": "Infinity Hole",
        "players": [
          {
            "id": 94,
            "name": "Joschi85",
            "displayName": "Joschi85",
            "role": "captain"
          },
          {
            "id": 65,
            "name": "Simon",
            "displayName": "Simon",
            "role": "member"
          }
        ]
      },
      {
        "id": 84,
        "name": "FACE/OFF",
        "players": [
          {
            "id": 19,
            "name": "Eisenseite",
            "displayName": "Eisenseite",
            "role": "captain"
          },
          {
            "id": 18,
            "name": "Chris0815",
            "displayName": "Chris0815",
            "role": "member"
          }
        ]
      },
      {
        "id": 71,
        "name": "Hamburg Power",
        "players": [
          {
            "id": 35,
            "name": "SofakissenFD",
            "displayName": "SofakissenFD",
            "role": "captain"
          },
          {
            "id": 38,
            "name": "Sylviesports",
            "displayName": "Sylviesports",
            "role": "member"
          }
        ]
      }
    ]
  },
  {
    "league_id": "liga-5-1",
    "teams": [
      {
        "id": 16,
        "name": "Die Fraggle’s",
        "players": [
          {
            "id": 22,
            "name": "poki",
            "displayName": "poki",
            "role": "captain"
          },
          {
            "id": 27,
            "name": "Werneroi Frank",
            "displayName": "Frank",
            "role": "member"
          }
        ]
      },
      {
        "id": 901,
        "name": "Dummy Team (Freispiel Bronze I)",
        "players": [],
        "is_dummy": true
      },
      {
        "id": 43,
        "name": "Die Zwei vom Grün",
        "players": [
          {
            "id": 90,
            "name": "Yolandi",
            "displayName": "Yolandi",
            "role": "captain"
          },
          {
            "id": 91,
            "name": "Cedien777",
            "displayName": "Cedien777",
            "role": "member"
          }
        ]
      },
      {
        "id": 73,
        "name": "Synchronschwinger",
        "players": [
          {
            "id": 138,
            "name": "Zwelch",
            "displayName": "Zwelch",
            "role": "captain"
          },
          {
            "id": 308,
            "name": "Stefan",
            "displayName": "Stebu86",
            "role": "member"
          }
        ]
      },
      {
        "id": 74,
        "name": "Ice on Fire",
        "players": [
          {
            "id": 104,
            "name": "Eve💫",
            "displayName": "Eve",
            "role": "captain"
          },
          {
            "id": 190,
            "name": "Kuschel",
            "displayName": "Kuschel",
            "role": "member"
          }
        ]
      },
      {
        "id": 69,
        "name": "Quantum Aimlock",
        "players": [
          {
            "id": 136,
            "name": "BlackHayate",
            "displayName": "BlackHayate",
            "role": "captain"
          },
          {
            "id": 135,
            "name": "Lalle",
            "displayName": "Lalle",
            "role": "member"
          }
        ]
      }
    ]
  },
  {
    "league_id": "liga-5-2",
    "teams": [
      {
        "id": 68,
        "name": "Die Anderen",
        "players": [
          {
            "id": 142,
            "name": "Numerobis",
            "displayName": "Numerobis",
            "role": "captain"
          },
          {
            "id": 143,
            "name": "Casch.k",
            "displayName": "Casch.k",
            "role": "member"
          }
        ]
      },
      {
        "id": 902,
        "name": "Dummy Team (Freispiel Bronze II)",
        "players": [],
        "is_dummy": true
      },
      {
        "id": 75,
        "name": "Empresses",
        "players": [
          {
            "id": 166,
            "name": "Marie",
            "displayName": "Maribon",
            "role": "captain"
          },
          {
            "id": 311,
            "name": "IRENE_irkis",
            "displayName": "IRENE",
            "role": "member"
          }
        ]
      },
      {
        "id": 65,
        "name": "Putt&Putter",
        "players": [
          {
            "id": 128,
            "name": "Baco",
            "displayName": "Baco",
            "role": "captain"
          },
          {
            "id": 129,
            "name": "Steffen",
            "displayName": "Steffen",
            "role": "member"
          }
        ]
      },
      {
        "id": 33,
        "name": "Holla die Waldfeen",
        "players": [
          {
            "id": 59,
            "name": "JuttaJ (Capella)",
            "displayName": "Capella",
            "role": "captain"
          },
          {
            "id": 60,
            "name": "Holly_Marie VR",
            "displayName": "Holly_Marie",
            "role": "member"
          }
        ]
      },
      {
        "id": 61,
        "name": "Pingu and the Brain",
        "players": [
          {
            "id": 114,
            "name": "zet1971 [P&B]",
            "displayName": "zet1971",
            "role": "captain"
          },
          {
            "id": 121,
            "name": "Pinguin",
            "displayName": "Pinguin",
            "role": "member"
          }
        ]
      }
    ]
  },
  {
    "league_id": "liga-6-1",
    "teams": [
      {
        "id": 88,
        "name": "Culinaric",
        "players": [
          {
            "id": 254,
            "name": "Bikerlady01",
            "displayName": "Bikerlady01",
            "role": "captain"
          },
          {
            "id": 332,
            "name": "Pharmo",
            "displayName": "Pharmo",
            "role": "member"
          }
        ]
      },
      {
        "id": 903,
        "name": "Dummy Team (Freispiel Eisen I)",
        "players": [],
        "is_dummy": true
      },
      {
        "id": 79,
        "name": "Die Rondorfer",
        "players": [
          {
            "id": 319,
            "name": "serschnee",
            "displayName": "Lothar",
            "role": "captain"
          },
          {
            "id": 54,
            "name": "Uhumasch",
            "displayName": "Uhumasch",
            "role": "member"
          }
        ]
      },
      {
        "id": 82,
        "name": "TRAUMPAR",
        "players": [
          {
            "id": 68,
            "name": "Sun Shine VR🌞ˢᵘⁿ ˢʰⁱⁿᵉ ᴳᵃᵐⁱⁿᵍ",
            "displayName": "SunShineVR",
            "role": "captain"
          },
          {
            "id": 150,
            "name": "SochiroVR",
            "displayName": "SochiroVR",
            "role": "member"
          }
        ]
      },
      {
        "id": 80,
        "name": "Kugelblitz",
        "players": [
          {
            "id": 79,
            "name": "Tippi",
            "displayName": "Tippi",
            "role": "captain"
          },
          {
            "id": 268,
            "name": "Jamaad",
            "displayName": "Jamaad",
            "role": "member"
          }
        ]
      },
      {
        "id": 81,
        "name": "Mach mal B",
        "players": [
          {
            "id": 299,
            "name": "OzOpalus",
            "displayName": "OzOpalus",
            "role": "captain"
          },
          {
            "id": 290,
            "name": "Isirider",
            "displayName": "Isirider",
            "role": "member"
          }
        ]
      }
    ]
  },
  {
    "league_id": "liga-6-2",
    "teams": [
      {
        "id": 83,
        "name": "Aimless & Dangerous",
        "players": [
          {
            "id": 64,
            "name": "DerDaniel82",
            "displayName": "DerDaniel82",
            "role": "captain"
          },
          {
            "id": 323,
            "name": "The Horseman",
            "displayName": "the_horseman",
            "role": "member"
          }
        ]
      },
      {
        "id": 904,
        "name": "Dummy Team (Freispiel Eisen II)",
        "players": [],
        "is_dummy": true
      },
      {
        "id": 86,
        "name": "Hein und Blöd",
        "players": [
          {
            "id": 137,
            "name": "Eigi",
            "displayName": "Eigi",
            "role": "captain"
          },
          {
            "id": 184,
            "name": "Tom",
            "displayName": "Tomtom",
            "role": "member"
          }
        ]
      },
      {
        "id": 85,
        "name": "WolfsgeheuLöffelohr",
        "players": [
          {
            "id": 331,
            "name": "RockMeKeith",
            "displayName": "Löffelohr",
            "role": "captain"
          },
          {
            "id": 333,
            "name": "Ylgvm2013",
            "displayName": "Wolfsgeheul",
            "role": "member"
          }
        ]
      },
      {
        "id": 87,
        "name": "M & M",
        "players": [
          {
            "id": 322,
            "name": "Mmoskito",
            "displayName": "Mmoskito",
            "role": "captain"
          },
          {
            "id": 13,
            "name": "Mamasita",
            "displayName": "Mamasita",
            "role": "member"
          }
        ]
      },
      {
        "id": 77,
        "name": "Putenschnitzel",
        "players": [
          {
            "id": 312,
            "name": "Matt",
            "displayName": "Matt",
            "role": "captain"
          },
          {
            "id": 320,
            "name": "Andre",
            "displayName": "Andre_ww",
            "role": "member"
          }
        ]
      }
    ]
  }
];

const LEAGUE_MATCHES = [
  {
    "id": 763,
    "league_id": "liga-1",
    "phase_id": "w1",
    "room_name": "W1L1S1",
    "team_a_id": 17,
    "team_b_id": 8,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-25|16",
    "confirmed_by_player_name": "Artox"
  },
  {
    "id": 765,
    "league_id": "liga-1",
    "phase_id": "w1",
    "room_name": "W1L1S2",
    "team_a_id": 5,
    "team_b_id": 2,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-25|19",
    "confirmed_by_player_name": "BuckRogers | ᴹᶦᵍʰᵗʸ ᴹᵃᶜʰᶦⁿᵉˢ"
  },
  {
    "id": 767,
    "league_id": "liga-1",
    "phase_id": "w1",
    "room_name": "W1L1S3",
    "team_a_id": 57,
    "team_b_id": 72,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-24|20",
    "confirmed_by_player_name": "Gio’"
  },
  {
    "id": 769,
    "league_id": "liga-1",
    "phase_id": "w2",
    "room_name": "W2L1S1",
    "team_a_id": 17,
    "team_b_id": 2,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-01|19",
    "confirmed_by_player_name": "Artox"
  },
  {
    "id": 771,
    "league_id": "liga-1",
    "phase_id": "w2",
    "room_name": "W2L1S2",
    "team_a_id": 8,
    "team_b_id": 72,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-05|18",
    "confirmed_by_player_name": "atiyes_LFL"
  },
  {
    "id": 773,
    "league_id": "liga-1",
    "phase_id": "w2",
    "room_name": "W2L1S3",
    "team_a_id": 5,
    "team_b_id": 57,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-01|20",
    "confirmed_by_player_name": "Gio’"
  },
  {
    "id": 775,
    "league_id": "liga-1",
    "phase_id": "w3",
    "room_name": "W3L1S1",
    "team_a_id": 17,
    "team_b_id": 72,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-26|17",
    "confirmed_by_player_name": "Artox"
  },
  {
    "id": 777,
    "league_id": "liga-1",
    "phase_id": "w3",
    "room_name": "W3L1S2",
    "team_a_id": 2,
    "team_b_id": 57,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-24|19",
    "confirmed_by_player_name": "BuckRogers | ᴹᶦᵍʰᵗʸ ᴹᵃᶜʰᶦⁿᵉˢ"
  },
  {
    "id": 779,
    "league_id": "liga-1",
    "phase_id": "w3",
    "room_name": "W3L1S3",
    "team_a_id": 8,
    "team_b_id": 5,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 781,
    "league_id": "liga-1",
    "phase_id": "w4",
    "room_name": "W4L1S1",
    "team_a_id": 17,
    "team_b_id": 57,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-26|20",
    "confirmed_by_player_name": "Biagio"
  },
  {
    "id": 783,
    "league_id": "liga-1",
    "phase_id": "w4",
    "room_name": "W4L1S2",
    "team_a_id": 72,
    "team_b_id": 5,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-14|19",
    "confirmed_by_player_name": "atiyes_LFL"
  },
  {
    "id": 785,
    "league_id": "liga-1",
    "phase_id": "w4",
    "room_name": "W4L1S3",
    "team_a_id": 2,
    "team_b_id": 8,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 787,
    "league_id": "liga-1",
    "phase_id": "w5",
    "room_name": "W5L1S1",
    "team_a_id": 17,
    "team_b_id": 5,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 789,
    "league_id": "liga-1",
    "phase_id": "w5",
    "room_name": "W5L1S2",
    "team_a_id": 57,
    "team_b_id": 8,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 791,
    "league_id": "liga-1",
    "phase_id": "w5",
    "room_name": "W5L1S3",
    "team_a_id": 72,
    "team_b_id": 2,
    "status": "SCHEDULED",
    "confirmed_slot": "2026-10-28|18",
    "confirmed_by_player_name": "BuckRogers | ᴹᶦᵍʰᵗʸ ᴹᵃᶜʰᶦⁿᵉˢ"
  },
  {
    "id": 764,
    "league_id": "liga-1",
    "phase_id": "w7",
    "room_name": "W7L1S1",
    "team_a_id": 8,
    "team_b_id": 17,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 766,
    "league_id": "liga-1",
    "phase_id": "w7",
    "room_name": "W7L1S2",
    "team_a_id": 2,
    "team_b_id": 5,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 768,
    "league_id": "liga-1",
    "phase_id": "w7",
    "room_name": "W7L1S3",
    "team_a_id": 72,
    "team_b_id": 57,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 770,
    "league_id": "liga-1",
    "phase_id": "w8",
    "room_name": "W8L1S1",
    "team_a_id": 2,
    "team_b_id": 17,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 772,
    "league_id": "liga-1",
    "phase_id": "w8",
    "room_name": "W8L1S2",
    "team_a_id": 72,
    "team_b_id": 8,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 774,
    "league_id": "liga-1",
    "phase_id": "w8",
    "room_name": "W8L1S3",
    "team_a_id": 57,
    "team_b_id": 5,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 776,
    "league_id": "liga-1",
    "phase_id": "w9",
    "room_name": "W9L1S1",
    "team_a_id": 72,
    "team_b_id": 17,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 778,
    "league_id": "liga-1",
    "phase_id": "w9",
    "room_name": "W9L1S2",
    "team_a_id": 57,
    "team_b_id": 2,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 780,
    "league_id": "liga-1",
    "phase_id": "w9",
    "room_name": "W9L1S3",
    "team_a_id": 5,
    "team_b_id": 8,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 782,
    "league_id": "liga-1",
    "phase_id": "w10",
    "room_name": "W10L1S1",
    "team_a_id": 57,
    "team_b_id": 17,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 784,
    "league_id": "liga-1",
    "phase_id": "w10",
    "room_name": "W10L1S2",
    "team_a_id": 5,
    "team_b_id": 72,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 786,
    "league_id": "liga-1",
    "phase_id": "w10",
    "room_name": "W10L1S3",
    "team_a_id": 8,
    "team_b_id": 2,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 788,
    "league_id": "liga-1",
    "phase_id": "w11",
    "room_name": "W11L1S1",
    "team_a_id": 5,
    "team_b_id": 17,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 790,
    "league_id": "liga-1",
    "phase_id": "w11",
    "room_name": "W11L1S2",
    "team_a_id": 8,
    "team_b_id": 57,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 792,
    "league_id": "liga-1",
    "phase_id": "w11",
    "room_name": "W11L1S3",
    "team_a_id": 2,
    "team_b_id": 72,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 793,
    "league_id": "liga-2",
    "phase_id": "w1",
    "room_name": "W1L2S1",
    "team_a_id": 1,
    "team_b_id": 31,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-30|21",
    "confirmed_by_player_name": "Ulverine"
  },
  {
    "id": 795,
    "league_id": "liga-2",
    "phase_id": "w1",
    "room_name": "W1L2S2",
    "team_a_id": 4,
    "team_b_id": 30,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-26|20",
    "confirmed_by_player_name": "Handrake 🐲"
  },
  {
    "id": 797,
    "league_id": "liga-2",
    "phase_id": "w1",
    "room_name": "W1L2S3",
    "team_a_id": 15,
    "team_b_id": 50,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-24|19",
    "confirmed_by_player_name": "TwizyNickyᴹᵉᵗᵃˡᴾᵘᵗᵗᵉʳˢ🤘"
  },
  {
    "id": 799,
    "league_id": "liga-2",
    "phase_id": "w2",
    "room_name": "W2L2S1",
    "team_a_id": 1,
    "team_b_id": 30,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 801,
    "league_id": "liga-2",
    "phase_id": "w2",
    "room_name": "W2L2S2",
    "team_a_id": 31,
    "team_b_id": 50,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-23|20",
    "confirmed_by_player_name": "Ulverine"
  },
  {
    "id": 803,
    "league_id": "liga-2",
    "phase_id": "w2",
    "room_name": "W2L2S3",
    "team_a_id": 4,
    "team_b_id": 15,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-29|20",
    "confirmed_by_player_name": "PascaLaVista"
  },
  {
    "id": 805,
    "league_id": "liga-2",
    "phase_id": "w3",
    "room_name": "W3L2S1",
    "team_a_id": 1,
    "team_b_id": 50,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-28|13",
    "confirmed_by_player_name": "TwizyNickyᴹᵉᵗᵃˡᴾᵘᵗᵗᵉʳˢ🤘"
  },
  {
    "id": 807,
    "league_id": "liga-2",
    "phase_id": "w3",
    "room_name": "W3L2S2",
    "team_a_id": 30,
    "team_b_id": 15,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-07|20",
    "confirmed_by_player_name": "Handrake 🐲"
  },
  {
    "id": 809,
    "league_id": "liga-2",
    "phase_id": "w3",
    "room_name": "W3L2S3",
    "team_a_id": 31,
    "team_b_id": 4,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-06|20",
    "confirmed_by_player_name": "PascaLaVista"
  },
  {
    "id": 811,
    "league_id": "liga-2",
    "phase_id": "w4",
    "room_name": "W4L2S1",
    "team_a_id": 1,
    "team_b_id": 15,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-12|21",
    "confirmed_by_player_name": "AlexConrad"
  },
  {
    "id": 813,
    "league_id": "liga-2",
    "phase_id": "w4",
    "room_name": "W4L2S2",
    "team_a_id": 50,
    "team_b_id": 4,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-12|20",
    "confirmed_by_player_name": "RunningNeo"
  },
  {
    "id": 815,
    "league_id": "liga-2",
    "phase_id": "w4",
    "room_name": "W4L2S3",
    "team_a_id": 30,
    "team_b_id": 31,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-14|20",
    "confirmed_by_player_name": "Ulverine"
  },
  {
    "id": 817,
    "league_id": "liga-2",
    "phase_id": "w5",
    "room_name": "W5L2S1",
    "team_a_id": 1,
    "team_b_id": 4,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-25|14",
    "confirmed_by_player_name": "Foxy 🦊"
  },
  {
    "id": 819,
    "league_id": "liga-2",
    "phase_id": "w5",
    "room_name": "W5L2S2",
    "team_a_id": 15,
    "team_b_id": 31,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-20|20",
    "confirmed_by_player_name": "Ulverine"
  },
  {
    "id": 821,
    "league_id": "liga-2",
    "phase_id": "w5",
    "room_name": "W5L2S3",
    "team_a_id": 50,
    "team_b_id": 30,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-20|11",
    "confirmed_by_player_name": "Handrake 🐲"
  },
  {
    "id": 794,
    "league_id": "liga-2",
    "phase_id": "w7",
    "room_name": "W7L2S1",
    "team_a_id": 31,
    "team_b_id": 1,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 796,
    "league_id": "liga-2",
    "phase_id": "w7",
    "room_name": "W7L2S2",
    "team_a_id": 30,
    "team_b_id": 4,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 798,
    "league_id": "liga-2",
    "phase_id": "w7",
    "room_name": "W7L2S3",
    "team_a_id": 50,
    "team_b_id": 15,
    "status": "SCHEDULED",
    "confirmed_slot": "2026-11-02|19",
    "confirmed_by_player_name": "AlexConrad"
  },
  {
    "id": 800,
    "league_id": "liga-2",
    "phase_id": "w8",
    "room_name": "W8L2S1",
    "team_a_id": 30,
    "team_b_id": 1,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 802,
    "league_id": "liga-2",
    "phase_id": "w8",
    "room_name": "W8L2S2",
    "team_a_id": 50,
    "team_b_id": 31,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 804,
    "league_id": "liga-2",
    "phase_id": "w8",
    "room_name": "W8L2S3",
    "team_a_id": 15,
    "team_b_id": 4,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 806,
    "league_id": "liga-2",
    "phase_id": "w9",
    "room_name": "W9L2S1",
    "team_a_id": 50,
    "team_b_id": 1,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 808,
    "league_id": "liga-2",
    "phase_id": "w9",
    "room_name": "W9L2S2",
    "team_a_id": 15,
    "team_b_id": 30,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 810,
    "league_id": "liga-2",
    "phase_id": "w9",
    "room_name": "W9L2S3",
    "team_a_id": 4,
    "team_b_id": 31,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 812,
    "league_id": "liga-2",
    "phase_id": "w10",
    "room_name": "W10L2S1",
    "team_a_id": 15,
    "team_b_id": 1,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 814,
    "league_id": "liga-2",
    "phase_id": "w10",
    "room_name": "W10L2S2",
    "team_a_id": 4,
    "team_b_id": 50,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 816,
    "league_id": "liga-2",
    "phase_id": "w10",
    "room_name": "W10L2S3",
    "team_a_id": 31,
    "team_b_id": 30,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 818,
    "league_id": "liga-2",
    "phase_id": "w11",
    "room_name": "W11L2S1",
    "team_a_id": 4,
    "team_b_id": 1,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 820,
    "league_id": "liga-2",
    "phase_id": "w11",
    "room_name": "W11L2S2",
    "team_a_id": 31,
    "team_b_id": 15,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 822,
    "league_id": "liga-2",
    "phase_id": "w11",
    "room_name": "W11L2S3",
    "team_a_id": 30,
    "team_b_id": 50,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 823,
    "league_id": "liga-3",
    "phase_id": "w1",
    "room_name": "W1L3S1",
    "team_a_id": 24,
    "team_b_id": 25,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-26|18",
    "confirmed_by_player_name": "Cyber_C_(Christian)"
  },
  {
    "id": 825,
    "league_id": "liga-3",
    "phase_id": "w1",
    "room_name": "W1L3S2",
    "team_a_id": 48,
    "team_b_id": 29,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-24|19",
    "confirmed_by_player_name": "Yurn1"
  },
  {
    "id": 827,
    "league_id": "liga-3",
    "phase_id": "w1",
    "room_name": "W1L3S3",
    "team_a_id": 18,
    "team_b_id": 42,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-26|19",
    "confirmed_by_player_name": "Leinadz"
  },
  {
    "id": 829,
    "league_id": "liga-3",
    "phase_id": "w2",
    "room_name": "W2L3S1",
    "team_a_id": 24,
    "team_b_id": 29,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-08|21",
    "confirmed_by_player_name": "Cyber_C_(Christian)"
  },
  {
    "id": 831,
    "league_id": "liga-3",
    "phase_id": "w2",
    "room_name": "W2L3S2",
    "team_a_id": 25,
    "team_b_id": 42,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 833,
    "league_id": "liga-3",
    "phase_id": "w2",
    "room_name": "W2L3S3",
    "team_a_id": 48,
    "team_b_id": 18,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-30|19",
    "confirmed_by_player_name": "Leinadz"
  },
  {
    "id": 835,
    "league_id": "liga-3",
    "phase_id": "w3",
    "room_name": "W3L3S1",
    "team_a_id": 24,
    "team_b_id": 42,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-11|17",
    "confirmed_by_player_name": "Cyber_C_(Christian)"
  },
  {
    "id": 837,
    "league_id": "liga-3",
    "phase_id": "w3",
    "room_name": "W3L3S2",
    "team_a_id": 29,
    "team_b_id": 18,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-06|20",
    "confirmed_by_player_name": "GLLG/Felix"
  },
  {
    "id": 839,
    "league_id": "liga-3",
    "phase_id": "w3",
    "room_name": "W3L3S3",
    "team_a_id": 25,
    "team_b_id": 48,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-07|19",
    "confirmed_by_player_name": "Yurn1"
  },
  {
    "id": 841,
    "league_id": "liga-3",
    "phase_id": "w4",
    "room_name": "W4L3S1",
    "team_a_id": 24,
    "team_b_id": 18,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-24|20",
    "confirmed_by_player_name": "Leinadz"
  },
  {
    "id": 843,
    "league_id": "liga-3",
    "phase_id": "w4",
    "room_name": "W4L3S2",
    "team_a_id": 42,
    "team_b_id": 48,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-14|19",
    "confirmed_by_player_name": "Yurn1"
  },
  {
    "id": 845,
    "league_id": "liga-3",
    "phase_id": "w4",
    "room_name": "W4L3S3",
    "team_a_id": 29,
    "team_b_id": 25,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 847,
    "league_id": "liga-3",
    "phase_id": "w5",
    "room_name": "W5L3S1",
    "team_a_id": 24,
    "team_b_id": 48,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 849,
    "league_id": "liga-3",
    "phase_id": "w5",
    "room_name": "W5L3S2",
    "team_a_id": 18,
    "team_b_id": 25,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 851,
    "league_id": "liga-3",
    "phase_id": "w5",
    "room_name": "W5L3S3",
    "team_a_id": 42,
    "team_b_id": 29,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-21|18",
    "confirmed_by_player_name": "Leviathan"
  },
  {
    "id": 824,
    "league_id": "liga-3",
    "phase_id": "w7",
    "room_name": "W7L3S1",
    "team_a_id": 25,
    "team_b_id": 24,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 826,
    "league_id": "liga-3",
    "phase_id": "w7",
    "room_name": "W7L3S2",
    "team_a_id": 29,
    "team_b_id": 48,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 828,
    "league_id": "liga-3",
    "phase_id": "w7",
    "room_name": "W7L3S3",
    "team_a_id": 42,
    "team_b_id": 18,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 830,
    "league_id": "liga-3",
    "phase_id": "w8",
    "room_name": "W8L3S1",
    "team_a_id": 29,
    "team_b_id": 24,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 832,
    "league_id": "liga-3",
    "phase_id": "w8",
    "room_name": "W8L3S2",
    "team_a_id": 42,
    "team_b_id": 25,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 834,
    "league_id": "liga-3",
    "phase_id": "w8",
    "room_name": "W8L3S3",
    "team_a_id": 18,
    "team_b_id": 48,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 836,
    "league_id": "liga-3",
    "phase_id": "w9",
    "room_name": "W9L3S1",
    "team_a_id": 42,
    "team_b_id": 24,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 838,
    "league_id": "liga-3",
    "phase_id": "w9",
    "room_name": "W9L3S2",
    "team_a_id": 18,
    "team_b_id": 29,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 840,
    "league_id": "liga-3",
    "phase_id": "w9",
    "room_name": "W9L3S3",
    "team_a_id": 48,
    "team_b_id": 25,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 842,
    "league_id": "liga-3",
    "phase_id": "w10",
    "room_name": "W10L3S1",
    "team_a_id": 18,
    "team_b_id": 24,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 844,
    "league_id": "liga-3",
    "phase_id": "w10",
    "room_name": "W10L3S2",
    "team_a_id": 48,
    "team_b_id": 42,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 846,
    "league_id": "liga-3",
    "phase_id": "w10",
    "room_name": "W10L3S3",
    "team_a_id": 25,
    "team_b_id": 29,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 848,
    "league_id": "liga-3",
    "phase_id": "w11",
    "room_name": "W11L3S1",
    "team_a_id": 48,
    "team_b_id": 24,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 850,
    "league_id": "liga-3",
    "phase_id": "w11",
    "room_name": "W11L3S2",
    "team_a_id": 25,
    "team_b_id": 18,
    "status": "WALKOVER",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 852,
    "league_id": "liga-3",
    "phase_id": "w11",
    "room_name": "W11L3S3",
    "team_a_id": 29,
    "team_b_id": 42,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 853,
    "league_id": "liga-4",
    "phase_id": "w1",
    "room_name": "W1L4S1",
    "team_a_id": 53,
    "team_b_id": 62,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-11|18",
    "confirmed_by_player_name": "Barkos2009[ᴮⁱʳᵈⁱᵉ ᴮʳᵒˢ]"
  },
  {
    "id": 855,
    "league_id": "liga-4",
    "phase_id": "w1",
    "room_name": "W1L4S2",
    "team_a_id": 54,
    "team_b_id": 47,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-27|18",
    "confirmed_by_player_name": "Who_Man_BF"
  },
  {
    "id": 857,
    "league_id": "liga-4",
    "phase_id": "w1",
    "room_name": "W1L4S3",
    "team_a_id": 84,
    "team_b_id": 71,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-24|19",
    "confirmed_by_player_name": "Eisenseite"
  },
  {
    "id": 859,
    "league_id": "liga-4",
    "phase_id": "w2",
    "room_name": "W2L4S1",
    "team_a_id": 53,
    "team_b_id": 47,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-11|17",
    "confirmed_by_player_name": "Joschi85"
  },
  {
    "id": 861,
    "league_id": "liga-4",
    "phase_id": "w2",
    "room_name": "W2L4S2",
    "team_a_id": 62,
    "team_b_id": 71,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-02|20",
    "confirmed_by_player_name": "Bolle"
  },
  {
    "id": 863,
    "league_id": "liga-4",
    "phase_id": "w2",
    "room_name": "W2L4S3",
    "team_a_id": 54,
    "team_b_id": 84,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-01|19",
    "confirmed_by_player_name": "Eisenseite"
  },
  {
    "id": 865,
    "league_id": "liga-4",
    "phase_id": "w3",
    "room_name": "W3L4S1",
    "team_a_id": 53,
    "team_b_id": 71,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-20|19",
    "confirmed_by_player_name": "SofakissenFD"
  },
  {
    "id": 867,
    "league_id": "liga-4",
    "phase_id": "w3",
    "room_name": "W3L4S2",
    "team_a_id": 47,
    "team_b_id": 84,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-06|22",
    "confirmed_by_player_name": "Chris0815"
  },
  {
    "id": 869,
    "league_id": "liga-4",
    "phase_id": "w3",
    "room_name": "W3L4S3",
    "team_a_id": 62,
    "team_b_id": 54,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-07|20",
    "confirmed_by_player_name": "Who_Man_BF"
  },
  {
    "id": 871,
    "league_id": "liga-4",
    "phase_id": "w4",
    "room_name": "W4L4S1",
    "team_a_id": 53,
    "team_b_id": 84,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-10|21",
    "confirmed_by_player_name": "Eisenseite"
  },
  {
    "id": 873,
    "league_id": "liga-4",
    "phase_id": "w4",
    "room_name": "W4L4S2",
    "team_a_id": 71,
    "team_b_id": 54,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-11|20",
    "confirmed_by_player_name": "SofakissenFD"
  },
  {
    "id": 875,
    "league_id": "liga-4",
    "phase_id": "w4",
    "room_name": "W4L4S3",
    "team_a_id": 47,
    "team_b_id": 62,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-18|16",
    "confirmed_by_player_name": "Joschi85"
  },
  {
    "id": 877,
    "league_id": "liga-4",
    "phase_id": "w5",
    "room_name": "W5L4S1",
    "team_a_id": 53,
    "team_b_id": 54,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-20|18",
    "confirmed_by_player_name": "Barkos2009[ᴮⁱʳᵈⁱᵉ ᴮʳᵒˢ]"
  },
  {
    "id": 879,
    "league_id": "liga-4",
    "phase_id": "w5",
    "room_name": "W5L4S2",
    "team_a_id": 84,
    "team_b_id": 62,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-19|20",
    "confirmed_by_player_name": "Eisenseite"
  },
  {
    "id": 881,
    "league_id": "liga-4",
    "phase_id": "w5",
    "room_name": "W5L4S3",
    "team_a_id": 71,
    "team_b_id": 47,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-25|19",
    "confirmed_by_player_name": "Joschi85"
  },
  {
    "id": 854,
    "league_id": "liga-4",
    "phase_id": "w7",
    "room_name": "W7L4S1",
    "team_a_id": 62,
    "team_b_id": 53,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-25|19",
    "confirmed_by_player_name": "Barkos2009[ᴮⁱʳᵈⁱᵉ ᴮʳᵒˢ]"
  },
  {
    "id": 856,
    "league_id": "liga-4",
    "phase_id": "w7",
    "room_name": "W7L4S2",
    "team_a_id": 47,
    "team_b_id": 54,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 858,
    "league_id": "liga-4",
    "phase_id": "w7",
    "room_name": "W7L4S3",
    "team_a_id": 71,
    "team_b_id": 84,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 860,
    "league_id": "liga-4",
    "phase_id": "w8",
    "room_name": "W8L4S1",
    "team_a_id": 47,
    "team_b_id": 53,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 862,
    "league_id": "liga-4",
    "phase_id": "w8",
    "room_name": "W8L4S2",
    "team_a_id": 71,
    "team_b_id": 62,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 864,
    "league_id": "liga-4",
    "phase_id": "w8",
    "room_name": "W8L4S3",
    "team_a_id": 84,
    "team_b_id": 54,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 866,
    "league_id": "liga-4",
    "phase_id": "w9",
    "room_name": "W9L4S1",
    "team_a_id": 71,
    "team_b_id": 53,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 868,
    "league_id": "liga-4",
    "phase_id": "w9",
    "room_name": "W9L4S2",
    "team_a_id": 84,
    "team_b_id": 47,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 870,
    "league_id": "liga-4",
    "phase_id": "w9",
    "room_name": "W9L4S3",
    "team_a_id": 54,
    "team_b_id": 62,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 872,
    "league_id": "liga-4",
    "phase_id": "w10",
    "room_name": "W10L4S1",
    "team_a_id": 84,
    "team_b_id": 53,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 874,
    "league_id": "liga-4",
    "phase_id": "w10",
    "room_name": "W10L4S2",
    "team_a_id": 54,
    "team_b_id": 71,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 876,
    "league_id": "liga-4",
    "phase_id": "w10",
    "room_name": "W10L4S3",
    "team_a_id": 62,
    "team_b_id": 47,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 878,
    "league_id": "liga-4",
    "phase_id": "w11",
    "room_name": "W11L4S1",
    "team_a_id": 54,
    "team_b_id": 53,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 880,
    "league_id": "liga-4",
    "phase_id": "w11",
    "room_name": "W11L4S2",
    "team_a_id": 62,
    "team_b_id": 84,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 882,
    "league_id": "liga-4",
    "phase_id": "w11",
    "room_name": "W11L4S3",
    "team_a_id": 47,
    "team_b_id": 71,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 883,
    "league_id": "liga-5-1",
    "phase_id": "w1",
    "room_name": "W1L5S1",
    "team_a_id": 16,
    "team_b_id": 901,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 885,
    "league_id": "liga-5-1",
    "phase_id": "w1",
    "room_name": "W1L5S2",
    "team_a_id": 43,
    "team_b_id": 73,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-22|20",
    "confirmed_by_player_name": "Zwelch"
  },
  {
    "id": 887,
    "league_id": "liga-5-1",
    "phase_id": "w1",
    "room_name": "W1L5S3",
    "team_a_id": 74,
    "team_b_id": 69,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-26|16",
    "confirmed_by_player_name": "BlackHayate"
  },
  {
    "id": 889,
    "league_id": "liga-5-1",
    "phase_id": "w2",
    "room_name": "W2L5S1",
    "team_a_id": 16,
    "team_b_id": 73,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-28|19",
    "confirmed_by_player_name": "Zwelch"
  },
  {
    "id": 891,
    "league_id": "liga-5-1",
    "phase_id": "w2",
    "room_name": "W2L5S2",
    "team_a_id": 901,
    "team_b_id": 69,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 893,
    "league_id": "liga-5-1",
    "phase_id": "w2",
    "room_name": "W2L5S3",
    "team_a_id": 43,
    "team_b_id": 74,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-29|19",
    "confirmed_by_player_name": "Kuschel"
  },
  {
    "id": 895,
    "league_id": "liga-5-1",
    "phase_id": "w3",
    "room_name": "W3L5S1",
    "team_a_id": 16,
    "team_b_id": 69,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-07|17",
    "confirmed_by_player_name": "BlackHayate"
  },
  {
    "id": 897,
    "league_id": "liga-5-1",
    "phase_id": "w3",
    "room_name": "W3L5S2",
    "team_a_id": 73,
    "team_b_id": 74,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-05|20",
    "confirmed_by_player_name": "Zwelch"
  },
  {
    "id": 899,
    "league_id": "liga-5-1",
    "phase_id": "w3",
    "room_name": "W3L5S3",
    "team_a_id": 901,
    "team_b_id": 43,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 901,
    "league_id": "liga-5-1",
    "phase_id": "w4",
    "room_name": "W4L5S1",
    "team_a_id": 16,
    "team_b_id": 74,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-13|20",
    "confirmed_by_player_name": "Eve💫"
  },
  {
    "id": 903,
    "league_id": "liga-5-1",
    "phase_id": "w4",
    "room_name": "W4L5S2",
    "team_a_id": 69,
    "team_b_id": 43,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-19|18",
    "confirmed_by_player_name": "BlackHayate"
  },
  {
    "id": 905,
    "league_id": "liga-5-1",
    "phase_id": "w4",
    "room_name": "W4L5S3",
    "team_a_id": 73,
    "team_b_id": 901,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 907,
    "league_id": "liga-5-1",
    "phase_id": "w5",
    "room_name": "W5L5S1",
    "team_a_id": 16,
    "team_b_id": 43,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-22|19",
    "confirmed_by_player_name": "Yolandi"
  },
  {
    "id": 909,
    "league_id": "liga-5-1",
    "phase_id": "w5",
    "room_name": "W5L5S2",
    "team_a_id": 74,
    "team_b_id": 901,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 911,
    "league_id": "liga-5-1",
    "phase_id": "w5",
    "room_name": "W5L5S3",
    "team_a_id": 69,
    "team_b_id": 73,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-22|20",
    "confirmed_by_player_name": "Zwelch"
  },
  {
    "id": 884,
    "league_id": "liga-5-1",
    "phase_id": "w7",
    "room_name": "W7L5S1",
    "team_a_id": 16,
    "team_b_id": 901,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 886,
    "league_id": "liga-5-1",
    "phase_id": "w7",
    "room_name": "W7L5S2",
    "team_a_id": 73,
    "team_b_id": 43,
    "status": "SCHEDULED",
    "confirmed_slot": "2026-10-28|20",
    "confirmed_by_player_name": "Yolandi"
  },
  {
    "id": 888,
    "league_id": "liga-5-1",
    "phase_id": "w7",
    "room_name": "W7L5S3",
    "team_a_id": 69,
    "team_b_id": 74,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 890,
    "league_id": "liga-5-1",
    "phase_id": "w8",
    "room_name": "W8L5S1",
    "team_a_id": 73,
    "team_b_id": 16,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 892,
    "league_id": "liga-5-1",
    "phase_id": "w8",
    "room_name": "W8L5S2",
    "team_a_id": 901,
    "team_b_id": 69,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 894,
    "league_id": "liga-5-1",
    "phase_id": "w8",
    "room_name": "W8L5S3",
    "team_a_id": 74,
    "team_b_id": 43,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 896,
    "league_id": "liga-5-1",
    "phase_id": "w9",
    "room_name": "W9L5S1",
    "team_a_id": 69,
    "team_b_id": 16,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 898,
    "league_id": "liga-5-1",
    "phase_id": "w9",
    "room_name": "W9L5S2",
    "team_a_id": 74,
    "team_b_id": 73,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 900,
    "league_id": "liga-5-1",
    "phase_id": "w9",
    "room_name": "W9L5S3",
    "team_a_id": 901,
    "team_b_id": 43,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 902,
    "league_id": "liga-5-1",
    "phase_id": "w10",
    "room_name": "W10L5S1",
    "team_a_id": 74,
    "team_b_id": 16,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 904,
    "league_id": "liga-5-1",
    "phase_id": "w10",
    "room_name": "W10L5S2",
    "team_a_id": 43,
    "team_b_id": 69,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 906,
    "league_id": "liga-5-1",
    "phase_id": "w10",
    "room_name": "W10L5S3",
    "team_a_id": 73,
    "team_b_id": 901,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 908,
    "league_id": "liga-5-1",
    "phase_id": "w11",
    "room_name": "W11L5S1",
    "team_a_id": 43,
    "team_b_id": 16,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 910,
    "league_id": "liga-5-1",
    "phase_id": "w11",
    "room_name": "W11L5S2",
    "team_a_id": 74,
    "team_b_id": 901,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 912,
    "league_id": "liga-5-1",
    "phase_id": "w11",
    "room_name": "W11L5S3",
    "team_a_id": 73,
    "team_b_id": 69,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 913,
    "league_id": "liga-5-2",
    "phase_id": "w1",
    "room_name": "W1L6S1",
    "team_a_id": 68,
    "team_b_id": 902,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 915,
    "league_id": "liga-5-2",
    "phase_id": "w1",
    "room_name": "W1L6S2",
    "team_a_id": 75,
    "team_b_id": 65,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-21|18",
    "confirmed_by_player_name": "Baco"
  },
  {
    "id": 917,
    "league_id": "liga-5-2",
    "phase_id": "w1",
    "room_name": "W1L6S3",
    "team_a_id": 33,
    "team_b_id": 61,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-04|18",
    "confirmed_by_player_name": "zet1971 [P&B]"
  },
  {
    "id": 919,
    "league_id": "liga-5-2",
    "phase_id": "w2",
    "room_name": "W2L6S1",
    "team_a_id": 68,
    "team_b_id": 65,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-01|20",
    "confirmed_by_player_name": "Baco"
  },
  {
    "id": 921,
    "league_id": "liga-5-2",
    "phase_id": "w2",
    "room_name": "W2L6S2",
    "team_a_id": 902,
    "team_b_id": 61,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 923,
    "league_id": "liga-5-2",
    "phase_id": "w2",
    "room_name": "W2L6S3",
    "team_a_id": 75,
    "team_b_id": 33,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-05|19",
    "confirmed_by_player_name": "JuttaJ (Capella)"
  },
  {
    "id": 925,
    "league_id": "liga-5-2",
    "phase_id": "w3",
    "room_name": "W3L6S1",
    "team_a_id": 68,
    "team_b_id": 61,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-11|18",
    "confirmed_by_player_name": "zet1971 [P&B]"
  },
  {
    "id": 927,
    "league_id": "liga-5-2",
    "phase_id": "w3",
    "room_name": "W3L6S2",
    "team_a_id": 65,
    "team_b_id": 33,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-09|19",
    "confirmed_by_player_name": "Baco"
  },
  {
    "id": 929,
    "league_id": "liga-5-2",
    "phase_id": "w3",
    "room_name": "W3L6S3",
    "team_a_id": 902,
    "team_b_id": 75,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 931,
    "league_id": "liga-5-2",
    "phase_id": "w4",
    "room_name": "W4L6S1",
    "team_a_id": 68,
    "team_b_id": 33,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-23|19",
    "confirmed_by_player_name": "JuttaJ (Capella)"
  },
  {
    "id": 933,
    "league_id": "liga-5-2",
    "phase_id": "w4",
    "room_name": "W4L6S2",
    "team_a_id": 61,
    "team_b_id": 75,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-15|18",
    "confirmed_by_player_name": "zet1971 [P&B]"
  },
  {
    "id": 935,
    "league_id": "liga-5-2",
    "phase_id": "w4",
    "room_name": "W4L6S3",
    "team_a_id": 65,
    "team_b_id": 902,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 937,
    "league_id": "liga-5-2",
    "phase_id": "w5",
    "room_name": "W5L6S1",
    "team_a_id": 68,
    "team_b_id": 75,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-24|17",
    "confirmed_by_player_name": "Numerobis"
  },
  {
    "id": 939,
    "league_id": "liga-5-2",
    "phase_id": "w5",
    "room_name": "W5L6S2",
    "team_a_id": 33,
    "team_b_id": 902,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 941,
    "league_id": "liga-5-2",
    "phase_id": "w5",
    "room_name": "W5L6S3",
    "team_a_id": 61,
    "team_b_id": 65,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-20|18",
    "confirmed_by_player_name": "Baco"
  },
  {
    "id": 914,
    "league_id": "liga-5-2",
    "phase_id": "w7",
    "room_name": "W7L6S1",
    "team_a_id": 68,
    "team_b_id": 902,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 916,
    "league_id": "liga-5-2",
    "phase_id": "w7",
    "room_name": "W7L6S2",
    "team_a_id": 65,
    "team_b_id": 75,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 918,
    "league_id": "liga-5-2",
    "phase_id": "w7",
    "room_name": "W7L6S3",
    "team_a_id": 61,
    "team_b_id": 33,
    "status": "SCHEDULED",
    "confirmed_slot": "2026-11-04|19",
    "confirmed_by_player_name": "JuttaJ (Capella)"
  },
  {
    "id": 920,
    "league_id": "liga-5-2",
    "phase_id": "w8",
    "room_name": "W8L6S1",
    "team_a_id": 65,
    "team_b_id": 68,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 922,
    "league_id": "liga-5-2",
    "phase_id": "w8",
    "room_name": "W8L6S2",
    "team_a_id": 902,
    "team_b_id": 61,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 924,
    "league_id": "liga-5-2",
    "phase_id": "w8",
    "room_name": "W8L6S3",
    "team_a_id": 33,
    "team_b_id": 75,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 926,
    "league_id": "liga-5-2",
    "phase_id": "w9",
    "room_name": "W9L6S1",
    "team_a_id": 61,
    "team_b_id": 68,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 928,
    "league_id": "liga-5-2",
    "phase_id": "w9",
    "room_name": "W9L6S2",
    "team_a_id": 33,
    "team_b_id": 65,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 930,
    "league_id": "liga-5-2",
    "phase_id": "w9",
    "room_name": "W9L6S3",
    "team_a_id": 902,
    "team_b_id": 75,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 932,
    "league_id": "liga-5-2",
    "phase_id": "w10",
    "room_name": "W10L6S1",
    "team_a_id": 33,
    "team_b_id": 68,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 934,
    "league_id": "liga-5-2",
    "phase_id": "w10",
    "room_name": "W10L6S2",
    "team_a_id": 75,
    "team_b_id": 61,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 936,
    "league_id": "liga-5-2",
    "phase_id": "w10",
    "room_name": "W10L6S3",
    "team_a_id": 65,
    "team_b_id": 902,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 938,
    "league_id": "liga-5-2",
    "phase_id": "w11",
    "room_name": "W11L6S1",
    "team_a_id": 75,
    "team_b_id": 68,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 940,
    "league_id": "liga-5-2",
    "phase_id": "w11",
    "room_name": "W11L6S2",
    "team_a_id": 33,
    "team_b_id": 902,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 942,
    "league_id": "liga-5-2",
    "phase_id": "w11",
    "room_name": "W11L6S3",
    "team_a_id": 65,
    "team_b_id": 61,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 943,
    "league_id": "liga-6-1",
    "phase_id": "w1",
    "room_name": "W1L7S1",
    "team_a_id": 88,
    "team_b_id": 903,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 945,
    "league_id": "liga-6-1",
    "phase_id": "w1",
    "room_name": "W1L7S2",
    "team_a_id": 79,
    "team_b_id": 82,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-29|19",
    "confirmed_by_player_name": "serschnee"
  },
  {
    "id": 947,
    "league_id": "liga-6-1",
    "phase_id": "w1",
    "room_name": "W1L7S3",
    "team_a_id": 80,
    "team_b_id": 81,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-26|13",
    "confirmed_by_player_name": "Tippi"
  },
  {
    "id": 949,
    "league_id": "liga-6-1",
    "phase_id": "w2",
    "room_name": "W2L7S1",
    "team_a_id": 88,
    "team_b_id": 82,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-02|19",
    "confirmed_by_player_name": "Sun Shine VR🌞ˢᵘⁿ ˢʰⁱⁿᵉ ᴳᵃᵐⁱⁿᵍ"
  },
  {
    "id": 951,
    "league_id": "liga-6-1",
    "phase_id": "w2",
    "room_name": "W2L7S2",
    "team_a_id": 903,
    "team_b_id": 81,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 953,
    "league_id": "liga-6-1",
    "phase_id": "w2",
    "room_name": "W2L7S3",
    "team_a_id": 79,
    "team_b_id": 80,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-02|13",
    "confirmed_by_player_name": "serschnee"
  },
  {
    "id": 955,
    "league_id": "liga-6-1",
    "phase_id": "w3",
    "room_name": "W3L7S1",
    "team_a_id": 88,
    "team_b_id": 81,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-07|19",
    "confirmed_by_player_name": "Pharmo"
  },
  {
    "id": 957,
    "league_id": "liga-6-1",
    "phase_id": "w3",
    "room_name": "W3L7S2",
    "team_a_id": 82,
    "team_b_id": 80,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-09|17",
    "confirmed_by_player_name": "Tippi"
  },
  {
    "id": 959,
    "league_id": "liga-6-1",
    "phase_id": "w3",
    "room_name": "W3L7S3",
    "team_a_id": 903,
    "team_b_id": 79,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 961,
    "league_id": "liga-6-1",
    "phase_id": "w4",
    "room_name": "W4L7S1",
    "team_a_id": 88,
    "team_b_id": 80,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-18|14",
    "confirmed_by_player_name": "Tippi"
  },
  {
    "id": 963,
    "league_id": "liga-6-1",
    "phase_id": "w4",
    "room_name": "W4L7S2",
    "team_a_id": 81,
    "team_b_id": 79,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-13|18",
    "confirmed_by_player_name": "serschnee"
  },
  {
    "id": 965,
    "league_id": "liga-6-1",
    "phase_id": "w4",
    "room_name": "W4L7S3",
    "team_a_id": 82,
    "team_b_id": 903,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 967,
    "league_id": "liga-6-1",
    "phase_id": "w5",
    "room_name": "W5L7S1",
    "team_a_id": 88,
    "team_b_id": 79,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-19|19",
    "confirmed_by_player_name": "Pharmo"
  },
  {
    "id": 969,
    "league_id": "liga-6-1",
    "phase_id": "w5",
    "room_name": "W5L7S2",
    "team_a_id": 80,
    "team_b_id": 903,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 971,
    "league_id": "liga-6-1",
    "phase_id": "w5",
    "room_name": "W5L7S3",
    "team_a_id": 81,
    "team_b_id": 82,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-23|20",
    "confirmed_by_player_name": "Sun Shine VR🌞ˢᵘⁿ ˢʰⁱⁿᵉ ᴳᵃᵐⁱⁿᵍ"
  },
  {
    "id": 944,
    "league_id": "liga-6-1",
    "phase_id": "w7",
    "room_name": "W7L7S1",
    "team_a_id": 88,
    "team_b_id": 903,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 946,
    "league_id": "liga-6-1",
    "phase_id": "w7",
    "room_name": "W7L7S2",
    "team_a_id": 82,
    "team_b_id": 79,
    "status": "SCHEDULED",
    "confirmed_slot": "2026-11-03|19",
    "confirmed_by_player_name": "serschnee"
  },
  {
    "id": 948,
    "league_id": "liga-6-1",
    "phase_id": "w7",
    "room_name": "W7L7S3",
    "team_a_id": 81,
    "team_b_id": 80,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 950,
    "league_id": "liga-6-1",
    "phase_id": "w8",
    "room_name": "W8L7S1",
    "team_a_id": 82,
    "team_b_id": 88,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 952,
    "league_id": "liga-6-1",
    "phase_id": "w8",
    "room_name": "W8L7S2",
    "team_a_id": 903,
    "team_b_id": 81,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 954,
    "league_id": "liga-6-1",
    "phase_id": "w8",
    "room_name": "W8L7S3",
    "team_a_id": 80,
    "team_b_id": 79,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-26|19",
    "confirmed_by_player_name": "serschnee"
  },
  {
    "id": 956,
    "league_id": "liga-6-1",
    "phase_id": "w9",
    "room_name": "W9L7S1",
    "team_a_id": 81,
    "team_b_id": 88,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 958,
    "league_id": "liga-6-1",
    "phase_id": "w9",
    "room_name": "W9L7S2",
    "team_a_id": 80,
    "team_b_id": 82,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 960,
    "league_id": "liga-6-1",
    "phase_id": "w9",
    "room_name": "W9L7S3",
    "team_a_id": 903,
    "team_b_id": 79,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 962,
    "league_id": "liga-6-1",
    "phase_id": "w10",
    "room_name": "W10L7S1",
    "team_a_id": 80,
    "team_b_id": 88,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 964,
    "league_id": "liga-6-1",
    "phase_id": "w10",
    "room_name": "W10L7S2",
    "team_a_id": 79,
    "team_b_id": 81,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 966,
    "league_id": "liga-6-1",
    "phase_id": "w10",
    "room_name": "W10L7S3",
    "team_a_id": 82,
    "team_b_id": 903,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 968,
    "league_id": "liga-6-1",
    "phase_id": "w11",
    "room_name": "W11L7S1",
    "team_a_id": 79,
    "team_b_id": 88,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 970,
    "league_id": "liga-6-1",
    "phase_id": "w11",
    "room_name": "W11L7S2",
    "team_a_id": 80,
    "team_b_id": 903,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 972,
    "league_id": "liga-6-1",
    "phase_id": "w11",
    "room_name": "W11L7S3",
    "team_a_id": 82,
    "team_b_id": 81,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 973,
    "league_id": "liga-6-2",
    "phase_id": "w1",
    "room_name": "W1L8S1",
    "team_a_id": 83,
    "team_b_id": 904,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 975,
    "league_id": "liga-6-2",
    "phase_id": "w1",
    "room_name": "W1L8S2",
    "team_a_id": 86,
    "team_b_id": 85,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-23|20",
    "confirmed_by_player_name": "Tom"
  },
  {
    "id": 977,
    "league_id": "liga-6-2",
    "phase_id": "w1",
    "room_name": "W1L8S3",
    "team_a_id": 87,
    "team_b_id": 77,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-09|20",
    "confirmed_by_player_name": "Mmoskito"
  },
  {
    "id": 979,
    "league_id": "liga-6-2",
    "phase_id": "w2",
    "room_name": "W2L8S1",
    "team_a_id": 83,
    "team_b_id": 85,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-07|18",
    "confirmed_by_player_name": "DerDaniel82"
  },
  {
    "id": 981,
    "league_id": "liga-6-2",
    "phase_id": "w2",
    "room_name": "W2L8S2",
    "team_a_id": 904,
    "team_b_id": 77,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 983,
    "league_id": "liga-6-2",
    "phase_id": "w2",
    "room_name": "W2L8S3",
    "team_a_id": 86,
    "team_b_id": 87,
    "status": "COMPLETED",
    "confirmed_slot": "2026-09-26|12",
    "confirmed_by_player_name": "Mmoskito"
  },
  {
    "id": 985,
    "league_id": "liga-6-2",
    "phase_id": "w3",
    "room_name": "W3L8S1",
    "team_a_id": 83,
    "team_b_id": 77,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-06|18",
    "confirmed_by_player_name": "Matt"
  },
  {
    "id": 987,
    "league_id": "liga-6-2",
    "phase_id": "w3",
    "room_name": "W3L8S2",
    "team_a_id": 85,
    "team_b_id": 87,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-11|13",
    "confirmed_by_player_name": "Mmoskito"
  },
  {
    "id": 989,
    "league_id": "liga-6-2",
    "phase_id": "w3",
    "room_name": "W3L8S3",
    "team_a_id": 904,
    "team_b_id": 86,
    "status": "COMPLETED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 991,
    "league_id": "liga-6-2",
    "phase_id": "w4",
    "room_name": "W4L8S1",
    "team_a_id": 83,
    "team_b_id": 87,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-13|20",
    "confirmed_by_player_name": "Mmoskito"
  },
  {
    "id": 993,
    "league_id": "liga-6-2",
    "phase_id": "w4",
    "room_name": "W4L8S2",
    "team_a_id": 77,
    "team_b_id": 86,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-25|12",
    "confirmed_by_player_name": "Matt"
  },
  {
    "id": 995,
    "league_id": "liga-6-2",
    "phase_id": "w4",
    "room_name": "W4L8S3",
    "team_a_id": 85,
    "team_b_id": 904,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 997,
    "league_id": "liga-6-2",
    "phase_id": "w5",
    "room_name": "W5L8S1",
    "team_a_id": 83,
    "team_b_id": 86,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-21|16",
    "confirmed_by_player_name": "DerDaniel82"
  },
  {
    "id": 999,
    "league_id": "liga-6-2",
    "phase_id": "w5",
    "room_name": "W5L8S2",
    "team_a_id": 87,
    "team_b_id": 904,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 1001,
    "league_id": "liga-6-2",
    "phase_id": "w5",
    "room_name": "W5L8S3",
    "team_a_id": 77,
    "team_b_id": 85,
    "status": "COMPLETED",
    "confirmed_slot": "2026-10-25|11",
    "confirmed_by_player_name": "Matt"
  },
  {
    "id": 974,
    "league_id": "liga-6-2",
    "phase_id": "w7",
    "room_name": "W7L8S1",
    "team_a_id": 83,
    "team_b_id": 904,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 976,
    "league_id": "liga-6-2",
    "phase_id": "w7",
    "room_name": "W7L8S2",
    "team_a_id": 85,
    "team_b_id": 86,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 978,
    "league_id": "liga-6-2",
    "phase_id": "w7",
    "room_name": "W7L8S3",
    "team_a_id": 77,
    "team_b_id": 87,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 980,
    "league_id": "liga-6-2",
    "phase_id": "w8",
    "room_name": "W8L8S1",
    "team_a_id": 85,
    "team_b_id": 83,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 982,
    "league_id": "liga-6-2",
    "phase_id": "w8",
    "room_name": "W8L8S2",
    "team_a_id": 904,
    "team_b_id": 77,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 984,
    "league_id": "liga-6-2",
    "phase_id": "w8",
    "room_name": "W8L8S3",
    "team_a_id": 87,
    "team_b_id": 86,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 986,
    "league_id": "liga-6-2",
    "phase_id": "w9",
    "room_name": "W9L8S1",
    "team_a_id": 77,
    "team_b_id": 83,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 988,
    "league_id": "liga-6-2",
    "phase_id": "w9",
    "room_name": "W9L8S2",
    "team_a_id": 87,
    "team_b_id": 85,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 990,
    "league_id": "liga-6-2",
    "phase_id": "w9",
    "room_name": "W9L8S3",
    "team_a_id": 904,
    "team_b_id": 86,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 992,
    "league_id": "liga-6-2",
    "phase_id": "w10",
    "room_name": "W10L8S1",
    "team_a_id": 87,
    "team_b_id": 83,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 994,
    "league_id": "liga-6-2",
    "phase_id": "w10",
    "room_name": "W10L8S2",
    "team_a_id": 86,
    "team_b_id": 77,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 996,
    "league_id": "liga-6-2",
    "phase_id": "w10",
    "room_name": "W10L8S3",
    "team_a_id": 85,
    "team_b_id": 904,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 998,
    "league_id": "liga-6-2",
    "phase_id": "w11",
    "room_name": "W11L8S1",
    "team_a_id": 86,
    "team_b_id": 83,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 1000,
    "league_id": "liga-6-2",
    "phase_id": "w11",
    "room_name": "W11L8S2",
    "team_a_id": 87,
    "team_b_id": 904,
    "status": "SCHEDULED_DUMMY_GAME",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  },
  {
    "id": 1002,
    "league_id": "liga-6-2",
    "phase_id": "w11",
    "room_name": "W11L8S3",
    "team_a_id": 85,
    "team_b_id": 77,
    "status": "SCHEDULED",
    "confirmed_slot": null,
    "confirmed_by_player_name": null
  }
];

module.exports = { LEAGUE_TEAMS, LEAGUE_MATCHES };
