import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { GameDataController } from './game_data/game-data.controller';
import { GameDataService } from './game_data/game-data.services';
import { StatisticsDataController } from './statistics_data/statistics-data.controller';
import { StatisticsDataService } from './statistics_data/statistics-data.services';

@Module({
  controllers: [
    DataController,
    GameDataController,
    StatisticsDataController,
  ],
  providers: [
    DataService,
    GameDataService,
    StatisticsDataService,
  ],
})
export class DataModule {}
