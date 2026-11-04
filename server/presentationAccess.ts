import { networkInterfaces } from 'node:os';

type NetworkAddress = {
  address: string;
  family: string | number;
  internal: boolean;
};

type NetworkMap = Record<string, NetworkAddress[] | undefined>;

const interfacePriority = (name: string) => {
  if (/^(wl|wifi|wlan)/i.test(name)) return 0;
  if (/^(en|eth)/i.test(name)) return 1;
  if (/^(docker|br-|veth|virbr|podman|tun|tap)/i.test(name)) return 3;
  return 2;
};

const isUsableIpv4 = (address: NetworkAddress) => (
  (address.family === 'IPv4' || address.family === 4)
  && !address.internal
  && !address.address.startsWith('127.')
  && !address.address.startsWith('169.254.')
  && address.address !== '0.0.0.0'
);

export const listPresentationOrigins = (
  port = 3000,
  interfaces: NetworkMap = networkInterfaces() as NetworkMap,
) => [...new Set(
  Object.entries(interfaces)
    .sort(([left], [right]) => interfacePriority(left) - interfacePriority(right))
    .flatMap(([, addresses]) => addresses ?? [])
    .filter(isUsableIpv4)
    .map(({ address }) => `http://${address}:${port}`),
)];
