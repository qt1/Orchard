using System;
using System.Collections.Generic;
using JetBrains.Annotations;
using Orchard.Data;
using Orchard.Environment.Configuration;
using Orchard.Logging;
using Orchard.ContentManagement;

namespace Orchard.Tasks {

    public interface IBackgroundService : IDependency {
        void Sweep();
    }

    [UsedImplicitly]
    public class BackgroundService : IBackgroundService {
        private readonly IEnumerable<IBackgroundTask> _tasks;
        private readonly ITransactionManager _transactionManager;
        private readonly IBackgroundHttpContextFactory _backgroundHttpContextFactory;
        private readonly string _shellName;

        public BackgroundService(
            IEnumerable<IBackgroundTask> tasks, 
            ITransactionManager transactionManager, 
            ShellSettings shellSettings,
            IContentManager contentManager,
            IBackgroundHttpContextFactory backgroundHttpContextFactory) {

            _tasks = tasks;
            _transactionManager = transactionManager;
            _backgroundHttpContextFactory = backgroundHttpContextFactory;
            _shellName = shellSettings.Name;
            Logger = NullLogger.Instance;
        }

        public ILogger Logger { get; set; }

        public void Sweep() {
            _backgroundHttpContextFactory.InitializeHttpContext();

            foreach(var task in _tasks) {
                var taskName = task.GetType().FullName;

                try {
                    Logger.Information("Start processing background task \"{0}\" on tenant \"{1}\".", taskName, _shellName);
                    _transactionManager.RequireNew();
                    task.Sweep();
                    Logger.Information("Finished processing background task \"{0}\" on tenant \"{1}\".", taskName, _shellName);
                }
                catch (Exception e) {
                    _transactionManager.Cancel();
                    Logger.Error(e, "Error while processing background task \"{0}\" on tenant \"{1}\".", taskName, _shellName);
                }
            }
        }
    }
}
