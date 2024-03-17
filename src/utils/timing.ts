import chalk from 'chalk';

class Timing {
    private start: number;
    private date: number;
    private nick: string;

    constructor(nick: string) {
        this.start = Bun.nanoseconds();
        this.date = Date.now();
        this.nick = nick;
    }

    public get startDateIso() {
        return new Date(this.date).toISOString();
    }

    public get duration() {
        const ms = (Bun.nanoseconds() - this.start) / 1000000;
        return ms;
    }

    public get durationString() {
        return `${this.duration}ms`;
    }

    public print() {
        console.log(chalk.gray(`${this.startDateIso}`), chalk.bgBlue(`${this.nick} `), chalk.gray(`${this.durationString}`));
    }
}

export default Timing;