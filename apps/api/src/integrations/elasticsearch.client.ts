import { Injectable } from '@nestjs/common';
import { ProviderClient } from './provider-client.js';

@Injectable()
export class ElasticsearchClient extends ProviderClient {
  constructor() {
    super('Elasticsearch', {
      node: process.env.ELASTICSEARCH_NODE,
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    });
  }
}
