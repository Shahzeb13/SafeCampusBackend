import chalk from 'chalk';

const brand = chalk.bold.blue('SafeCampus');
const divider = chalk.dim('─'.repeat(40));

export const logger = {
  info: (msg: string) => console.log(`${chalk.blue('ℹ')} ${chalk.dim(msg)}`),
  success: (msg: string) => console.log(`${chalk.green('✔')} ${msg}`),
  error: (msg: string) => console.log(`${chalk.red('✘')} ${chalk.bold.red(msg)}`),
  warn: (msg: string) => console.log(`${chalk.yellow('⚠')} ${msg}`),
  
  startup: (port: string | number) => {
    console.log('\n' + divider);
    console.log(`${brand} ${chalk.dim('|')} ${chalk.cyan('Security System Engine')}`);
    console.log(divider);
    console.log(`${chalk.blue('🌐')} ${chalk.white('Server Port :')} ${chalk.bold.cyan(port)}`);
    console.log(`${chalk.blue('🔗')} ${chalk.white('Local URL   :')} ${chalk.underline.blue(`http://localhost:${port}`)}`);
    console.log(divider + '\n');
  },

  dbConnected: () => {
    console.log(`${chalk.green('🔋')} ${chalk.white('Database    :')} ${chalk.bold.green('Connected')} ${chalk.dim('(MongoDB Atlas)')}`);
    console.log(chalk.dim('Listening for incoming requests...\n'));
  }
};

