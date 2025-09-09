import { Request, Response } from 'express';

import UserService from '../service/userService';

class UserController {
  async addUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, phoneNumber } = req.body;
      const response = await UserService.addUser({
        email,
        password,
        phoneNumber,
      });
      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const token = await UserService.login(email, password);
      res.json({ token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default new UserController();
