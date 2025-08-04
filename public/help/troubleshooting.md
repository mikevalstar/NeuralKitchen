# Troubleshooting

Common issues and solutions when using Neural Kitchen.

## Getting Started Issues

### Application Won't Start

**Symptom**: Error when running `pnpm dev`

**Common Causes**:
1. **Missing Dependencies**
   - Solution: Run `pnpm install`
   - Verify: Check `node_modules` exists

2. **Database Connection**
   - Solution: Check your `.env` file has `DATABASE_URL`
   - Verify: Run `pnpm db:generate` and `pnpm db:push`

3. **Port Conflicts**
   - Solution: Kill processes on ports 3000 and 3002
   - Command: `lsof -ti:3000 | xargs kill -9`

### MCP Server Issues

**Symptom**: MCP server failing to start

**Solutions**:
1. **Missing OpenAI API Key**
   ```bash
   echo "OPENAI_API_KEY=your_key_here" >> .env
   ```

2. **Port 3002 In Use**
   ```bash
   lsof -ti:3002 | xargs kill -9
   pnpm mcp:dev
   ```

3. **Database Access Issues**
   - Ensure the main app database is set up correctly
   - MCP server uses the same database connection

## Recipe Management Issues

### Recipes Not Saving

**Symptom**: Changes don't persist or error on save

**Common Causes**:
1. **Validation Errors**
   - Check for empty required fields
   - Verify shortId doesn't contain invalid characters

2. **Database Issues**
   - Check database connection
   - Verify migrations are up to date: `pnpm db:migrate`

3. **Content Too Large**
   - Content has practical limits for embedding generation
   - Break large recipes into smaller, focused ones

### AI Processing Not Working

**Symptom**: No summaries generated, search not working

**Solutions**:
1. **Check OpenAI API Key**
   ```bash
   # Test API key works
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. **Check Queue Processing**
   - Visit `/queue` to see pending items
   - Look for error messages in console logs

3. **Restart Queue Processor**
   - Queue processing starts automatically with `pnpm dev`
   - Check console for error messages

## Search Issues

### No Search Results

**Symptom**: Search returns empty results for known content

**Troubleshooting Steps**:
1. **Check if recipes are processed**
   - Visit `/queue` to see if items are pending
   - New recipes need processing before they're searchable

2. **Try exact title matches**
   - Search falls back to text search if vector search fails
   - If text search works, it's an embedding issue

3. **Verify OpenAI integration**
   - Check API key is valid
   - Check console for embedding generation errors

### Search Results Not Relevant

**Symptom**: Search returns unexpected or poor results

**Solutions**:
1. **Improve search queries**
   - Use more specific terms
   - Include technology names
   - Try different phrasings

2. **Check recipe content**
   - Ensure recipes have good titles and descriptions
   - Add relevant tags for better categorization

## Database Issues

### Migration Failures

**Symptom**: Database migration errors

**Solutions**:
1. **Reset and restart**
   ```bash
   pnpm db:migrate:reset
   pnpm db:seed
   ```

2. **Check PostgreSQL extensions**
   - Ensure `pgvector` extension is available
   - May need database admin to install extensions

3. **Connection string issues**
   - Verify `DATABASE_URL` format is correct
   - Check database server is running

### Data Corruption

**Symptom**: Recipes appear broken or missing

**Solutions**:
1. **Check soft deletes**
   - Items might be soft-deleted, not permanently gone
   - Check database directly if needed

2. **Restore from backup**
   - Regular database backups are recommended
   - Contact your database administrator

## Performance Issues

### Slow Loading

**Symptom**: Pages take long time to load

**Solutions**:
1. **Database query optimization**
   - Check if database has proper indexes
   - Consider database connection pooling

2. **Large content handling**
   - Very large recipes may impact performance
   - Consider breaking into smaller recipes

### Memory Issues

**Symptom**: Application crashes or runs out of memory

**Solutions**:
1. **Restart the application**
   ```bash
   # Stop all processes
   pkill -f "pnpm dev"
   # Restart
   pnpm dev
   ```

2. **Check for memory leaks**
   - Monitor Node.js memory usage
   - Restart periodically if needed

## Getting Help

### Enable Debug Logging

1. **Check console output** when running `pnpm dev`
2. **Look for error messages** in browser developer tools
3. **Check queue processing logs** for AI-related issues

### Collect Information

When reporting issues, include:
- **Steps to reproduce** the problem
- **Error messages** from console or browser
- **Environment details** (Node version, OS, etc.)
- **Recent changes** you made before the issue

### Common Log Locations

- **Application logs**: Console where you run `pnpm dev`
- **Browser logs**: Developer Tools → Console
- **Database logs**: Check PostgreSQL logs if applicable
- **Queue processing**: Look for OpenAI API errors in console

## Prevention

### Regular Maintenance

1. **Keep dependencies updated** (but test changes)
2. **Monitor database growth** and performance
3. **Backup your data** regularly
4. **Test after making changes** to recipes or configuration

### Best Practices

1. **Use version control** for your recipe content
2. **Document your setup** for team members
3. **Monitor API usage** to avoid OpenAI rate limits
4. **Test recipes** before relying on them

## Next Steps

- Check [FAQ](faq) for additional common questions
- Review [Best Practices](best-practices) for optimal usage
- Learn about [MCP Integration](mcp-server)
- Return to [Help Home](home)