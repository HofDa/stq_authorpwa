import { isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SensorPermissionGate } from './SensorPermissionGate';

describe('SensorPermissionGate', () => {
  it('renders required sensor labels and explanation', () => {
    const html = renderToStaticMarkup(
      <SensorPermissionGate
        requirements={['gps', 'orientation', 'motion']}
        onRequestPermissions={async () => {}}
      />,
    );

    expect(html).toContain('Activate sensors');
    expect(html).toContain('GPS location');
    expect(html).toContain('Compass heading');
    expect(html).toContain('Motion sensor');
    expect(html).toContain('live device signals');
    expect(html).toContain('Sensors stay off until you activate them.');
  });

  it('shows compact denied and unavailable messages', () => {
    expect(
      renderToStaticMarkup(
        <SensorPermissionGate
          requirements={['gps']}
          onRequestPermissions={async () => {}}
          status="denied"
        />,
      ),
    ).toContain('Sensor access was denied');

    expect(
      renderToStaticMarkup(
        <SensorPermissionGate
          requirements={['orientation']}
          onRequestPermissions={async () => {}}
          status="unavailable"
        />,
      ),
    ).toContain('required sensors are unavailable');
  });

  it('calls onRequestPermissions from the button click handler', async () => {
    const onRequestPermissions = vi.fn(async () => {});
    const element = SensorPermissionGate({
      requirements: ['gps'],
      onRequestPermissions,
    });
    const button = findElementByType(element, 'button');

    await button.props.onClick();

    expect(onRequestPermissions).toHaveBeenCalledTimes(1);
  });
});

function findElementByType(
  node: ReactNode,
  type: string,
): { props: { onClick: () => Promise<void> } } {
  if (!isValidElement(node)) {
    throw new Error(`Could not find ${type}`);
  }

  if (node.type === type) {
    return node as { props: { onClick: () => Promise<void> } };
  }

  const children = node.props.children as ReactNode | ReactNode[] | undefined;
  const childNodes = Array.isArray(children) ? children : [children];
  for (const child of childNodes) {
    if (child === undefined || child === null) continue;
    try {
      return findElementByType(child, type);
    } catch {
      // Continue searching sibling nodes.
    }
  }

  throw new Error(`Could not find ${type}`);
}
