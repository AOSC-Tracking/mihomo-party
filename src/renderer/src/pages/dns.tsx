import { Button, Tab, Input, Switch, Tabs, Divider } from '@nextui-org/react'
import BasePage from '@renderer/components/base/base-page'
import { MdDeleteForever } from 'react-icons/md'
import SettingCard from '@renderer/components/base/base-setting-card'
import SettingItem from '@renderer/components/base/base-setting-item'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import { restartCore } from '@renderer/utils/ipc'
import React, { Key, useState } from 'react'

const DNS: React.FC = () => {
  const { controledMihomoConfig, patchControledMihomoConfig } = useControledMihomoConfig()
  const { dns, hosts } = controledMihomoConfig || {}
  const {
    ipv6 = false,
    'enhanced-mode': enhancedMode = 'fake-ip',
    'use-hosts': useHosts = false,
    'use-system-hosts': useSystemHosts = false,
    nameserver = ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query']
  } = dns || {}

  const [values, setValues] = useState({
    ipv6,
    useHosts,
    enhancedMode,
    useSystemHosts,
    nameserver,
    hosts: Object.entries(hosts || {}).map(([domain, value]) => ({ domain, value }))
  })

  const handleNameserverChange = (value: string, index: number): void => {
    const newNameservers = [...values.nameserver]
    if (index === newNameservers.length) {
      if (value.trim() !== '') {
        newNameservers.push(value)
      }
    } else {
      if (value.trim() === '') {
        newNameservers.splice(index, 1)
      } else {
        newNameservers[index] = value
      }
    }
    setValues({ ...values, nameserver: newNameservers })
  }
  const handleHostsChange = (domain: string, value: string, index: number): void => {
    const newHosts = [...values.hosts]

    if (index === newHosts.length) {
      if (domain.trim() !== '' || value.trim() !== '') {
        newHosts.push({ domain: domain.trim(), value: value.trim() })
      }
    } else {
      if (domain.trim() === '' && value.trim() === '') {
        newHosts.splice(index, 1)
      } else {
        newHosts[index] = { domain: domain.trim(), value: value.trim() }
      }
    }
    setValues({ ...values, hosts: newHosts })
  }

  const onSave = async (patch: Partial<IMihomoConfig>): Promise<void> => {
    await patchControledMihomoConfig(patch)
    await restartCore()
  }

  return (
    <BasePage
      title="DNS 设置"
      header={
        <Button
          size="sm"
          color="primary"
          onPress={() => {
            const hostsObject = values.hosts.reduce((acc, { domain, value }) => {
              if (domain) {
                acc[domain] = value
              }
              return acc
            }, {})
            onSave({
              dns: {
                ipv6: values.ipv6,
                'enhanced-mode': values.enhancedMode,
                'use-hosts': values.useHosts,
                'use-system-hosts': values.useSystemHosts,
                nameserver: values.nameserver
              },
              hosts: hostsObject
            })
          }}
        >
          保存
        </Button>
      }
    >
      <SettingCard>
        <SettingItem title="域名映射模式" divider>
          <Tabs
            size="sm"
            color="primary"
            selectedKey={values.enhancedMode}
            onSelectionChange={(key: Key) => setValues({ ...values, enhancedMode: key as DnsMode })}
          >
            <Tab key="fake-ip" title="虚假IP" className="select-none" />
            <Tab key="redir-host" title="真实IP" className="select-none" />
            <Tab key="normal" title="取消映射" className="select-none" />
          </Tabs>
        </SettingItem>
        <SettingItem title="IPv6" divider>
          <Switch
            size="sm"
            isSelected={values.ipv6}
            onValueChange={(v) => {
              setValues({ ...values, ipv6: v })
            }}
          />
        </SettingItem>
        <div className="flex flex-col items-stretch">
          <h3 className="select-none mb-2">DNS服务器</h3>
          {[...values.nameserver, ''].map((ns, index) => (
            <div key={index} className="mb-2 flex">
              <Input
                fullWidth
                size="sm"
                placeholder="例: tls://223.5.5.5"
                value={ns}
                onValueChange={(v) => handleNameserverChange(v, index)}
              />
              {index < values.nameserver.length && (
                <Button
                  className="ml-2"
                  size="sm"
                  variant="flat"
                  color="warning"
                  onClick={() => handleNameserverChange('', index)}
                >
                  <MdDeleteForever className="text-lg" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Divider />
        <SettingItem title="使用系统hosts" divider>
          <Switch
            size="sm"
            isSelected={values.useSystemHosts}
            onValueChange={(v) => {
              setValues({ ...values, useSystemHosts: v })
            }}
          />
        </SettingItem>
        <SettingItem title="自定义hosts">
          <Switch
            size="sm"
            isSelected={values.useHosts}
            onValueChange={(v) => {
              setValues({ ...values, useHosts: v })
            }}
          />
        </SettingItem>
        {values.useHosts && (
          <div className="flex flex-col items-stretch">
            <h3 className="mb-2"></h3>
            {[...values.hosts, { domain: '', value: '' }].map(({ domain, value }, index) => (
              <div key={index} className="flex mb-2">
                <div className="flex-[4]">
                  <Input
                    size="sm"
                    fullWidth
                    placeholder="域名"
                    value={domain}
                    onValueChange={(v) =>
                      handleHostsChange(v, Array.isArray(value) ? value.join(', ') : value, index)
                    }
                  />
                </div>
                <span className="select-none mx-2">:</span>
                <div className="flex-[6] flex">
                  <Input
                    size="sm"
                    fullWidth
                    placeholder="IP 或域名"
                    value={Array.isArray(value) ? value.join(', ') : value}
                    onValueChange={(v) => handleHostsChange(domain, v, index)}
                  />
                  {index < values.hosts.length && (
                    <Button
                      size="sm"
                      color="warning"
                      variant="flat"
                      className="ml-2"
                      onClick={() => handleHostsChange('', '', index)}
                    >
                      <MdDeleteForever className="text-lg" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingCard>
    </BasePage>
  )
}

export default DNS