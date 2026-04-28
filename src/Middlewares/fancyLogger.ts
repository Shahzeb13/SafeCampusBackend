import type { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

export const fancyRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    
    let statusColor = chalk.green;
    if (statusCode >= 400) statusColor = chalk.yellow;
    if (statusCode >= 500) statusColor = chalk.red;
    
    const methodColor = {
      GET: chalk.blue,
      POST: chalk.magenta,
      PUT: chalk.cyan,
      DELETE: chalk.red,
      PATCH: chalk.yellow
    }[method] || chalk.white;

    console.log(
      `${chalk.dim('│')} ${chalk.dim(new Date().toLocaleTimeString())} ` +
      `${methodColor(method.padEnd(7))} ` +
      `${chalk.white(url.split('?')[0])} ` +
      `${statusColor(statusCode)} ` +
      `${chalk.dim('•')} ${chalk.dim(duration + 'ms')}`
    );

  });
  
  next();
};
