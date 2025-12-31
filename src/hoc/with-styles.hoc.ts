import React, {CSSProperties} from 'react';

export const withStyles = (children: JSX.Element, styles: CSSProperties) =>
  React.Children.map(children, child =>
    React.cloneElement(child, {
      style: styles,
    }),
  );
