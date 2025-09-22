import { Client } from '@opensearch-project/opensearch';

export const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
});
