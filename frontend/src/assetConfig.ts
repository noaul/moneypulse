export type FieldType = 'text' | 'number' | 'date' | 'textarea';

export interface AssetField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
}

export interface AssetPageConfig {
  endpoint: 'phones' | 'vps' | 'domains' | 'subscriptions';
  title: string;
  singular: string;
  primaryKey: string;
  secondaryKey: string;
  dueKey: string;
  fields: AssetField[];
}

export const assetPageConfigs: AssetPageConfig[] = [
  {
    endpoint: 'phones',
    title: '电话卡',
    singular: '电话卡',
    primaryKey: 'cardNumber',
    secondaryKey: 'carrier',
    dueKey: 'nextDueDate',
    fields: [
      { key: 'cardNumber', label: '手机号 / 卡号', type: 'text', required: true },
      { key: 'carrier', label: '运营商', type: 'text' },
      { key: 'planName', label: '套餐名称', type: 'text' },
      { key: 'billingDay', label: '扣费日', type: 'number' },
      { key: 'activateDate', label: '开卡日期', type: 'date' },
      { key: 'expireDate', label: '到期日', type: 'date' }
    ]
  },
  {
    endpoint: 'vps',
    title: 'VPS',
    singular: 'VPS',
    primaryKey: 'name',
    secondaryKey: 'provider',
    dueKey: 'nextDueDate',
    fields: [
      { key: 'name', label: '名称', type: 'text', required: true },
      { key: 'provider', label: '供应商', type: 'text' },
      { key: 'ipAddress', label: 'IP 地址', type: 'text' },
      { key: 'location', label: '机房位置', type: 'text' },
      { key: 'cpu', label: 'CPU', type: 'text' },
      { key: 'memory', label: '内存', type: 'text' },
      { key: 'storage', label: '硬盘', type: 'text' },
      { key: 'bandwidth', label: '流量 / 带宽', type: 'text' },
      { key: 'os', label: '系统', type: 'text' },
      { key: 'startDate', label: '开始日期', type: 'date' },
      { key: 'expireDate', label: '到期日', type: 'date' }
    ]
  },
  {
    endpoint: 'domains',
    title: '域名',
    singular: '域名',
    primaryKey: 'domainName',
    secondaryKey: 'registrar',
    dueKey: 'expireDate',
    fields: [
      { key: 'domainName', label: '域名', type: 'text', required: true },
      { key: 'registrar', label: '注册商', type: 'text' },
      { key: 'dnsProvider', label: 'DNS 托管商', type: 'text' },
      { key: 'purpose', label: '用途', type: 'text' },
      { key: 'registerDate', label: '注册日期', type: 'date' },
      { key: 'expireDate', label: '到期日', type: 'date' }
    ]
  },
  {
    endpoint: 'subscriptions',
    title: '订阅',
    singular: '订阅',
    primaryKey: 'name',
    secondaryKey: 'provider',
    dueKey: 'nextDueDate',
    fields: [
      { key: 'name', label: '订阅名称', type: 'text', required: true },
      { key: 'provider', label: '服务商', type: 'text' },
      { key: 'account', label: '账号 / 邮箱', type: 'text' },
      { key: 'category', label: '分类', type: 'text' }
    ]
  }
];
